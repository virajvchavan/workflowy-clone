class Note
  include Mongoid::Document
  field :content, type: String

  # stores the path from the root node
  field :path, type: String
  field :order, type: Integer
  field :collapsed, type: Boolean, default: false

  belongs_to :user, class_name: "User"
  validates :order, :presence => true
  validates :path, :presence => true

  before_destroy :remove_from_parent

  def child_notes_json
    # todo: can be used when frontend requests data for only one note and its tree
    []
  end

  # corrects the field 'order' for siblings which come after a note.
  # Also, we're not deleting any of its children because its the client's(React app's) responsibility...
  # ...to assign them new parents or delete them separately
  def remove_from_parent
    siblings = Note.where(user_id: self.user_id, path: self.path, 'order' => {'$gt' => self.order})
    siblings.each do |sibling|
      if sibling
        sibling.update(order: sibling.order - 1)
      end
    end
  end

  # Assuming the note_id we're passing does not exist and was previously deleted
  # this cleans up ghost notes with dead parent_ids in their path
  def self.delete_children_tree(note_id)
    Note.where(path: /#{note_id}/).destroy_all
  end

  # adds a child to a parent note
  # if the note to add has a valid id, just change the path & index for that note
  # if the note has a temp_id generated by client, create a new note
  # the note to add may have children, and some of those may be with a valid id and some with a temp one.
  def self.add_new_child_tree(user_id, parent_id, index, note_id, fields, indexPath, new_note_ids)
    note_path = "/"
    if parent_id && parent_id != "root"
      parent = Note.find(parent_id)
      note_path = parent.path + "#{parent.id}/"
    end

    note_fields = {
      order: index,
      path: note_path
    }
    fields.keys.each do |key|
      if (key.in?(["content", "collapsed"]))
        note_fields[key] = fields[key]
      end
    end

    # get or create note
    if note_id.starts_with?("temp")
      note_fields[:user_id] = user_id
      current_note = Note.create(note_fields)
      new_note_ids.push({indexPath: indexPath.dup, note_id: current_note.id.to_s})
    else
      current_note = Note.find(note_id)
      current_note.update(note_fields)
    end

    correct_orders_for_siblings(user_id, note_path, index, false, current_note.id)

    # recursively call this fn if fields has any child_notes
    if fields[:child_notes] && fields[:child_notes].length > 0
      fields[:child_notes].each_with_index do |note, child_index|
        add_new_child_tree(user_id, current_note.id, child_index, note[:id], note, indexPath.dup.push(child_index), new_note_ids)
      end
    end

    new_note_ids
  end

  def self.root_notes_json(user_id)
    notes = User.find(user_id).notes.order_by(path: :asc, order: :asc)

    # the fn assumes that the notes are returned sorted by level in the tree
    notes = notes.sort {|note1, note2| note1.path.size <=> note2.path.size }

    json = {}
    notes.each do |note|
      note_json = { content: note.content, child_notes: {}, collapsed: note.collapsed }
      if note.path == "/"
        json[note.id.to_s] = note_json
      elsif json
        parent = json
        parent_ids = note.path.delete_prefix("/").split("/")
        parent_ids.each do |note_id|
          if parent && parent[:child_notes] && parent[:child_notes][note_id.to_s]
            parent = parent[:child_notes][note_id.to_s]
          elsif parent && parent[note_id.to_s]
            parent = parent[note_id.to_s]
          end
        end
        if parent && parent[:child_notes]
          parent[:child_notes][note.id.to_s] = note_json
        end
      end
    end
    get_notes_as_arrays(json)
  end

  private

  def self.get_notes_as_arrays(notes)
    res = []
    notes.keys.each do |key|
      res.push(notes[key].merge(
        id: key,
        child_notes: get_notes_as_arrays(notes[key][:child_notes])
      ))
    end
    res
  end

  # path: all siblings have the same path
  # order: the siblings which have order greater than this will be affected
  # move_left: if true, decrements indexes by 1, if false, increments by 1
  def self.correct_orders_for_siblings(user_id, path, index, move_left, note_id_to_skip)
    siblings = Note.where(user_id: user_id, path: path, 'order' => {'$gte' => index})
    siblings.each do |sibling|
      if sibling && sibling.id != note_id_to_skip
        new_order = move_left ? sibling.order - 1 : sibling.order + 1
        sibling.update(order: new_order)
      end
    end
  end
end
