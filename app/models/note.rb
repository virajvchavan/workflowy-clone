# frozen_string_literal: true

class Note
  include Mongoid::Document
  field :content, type: String

  # stores the path from the root node
  field :path, type: String
  field :order, type: Integer
  field :collapsed, type: Boolean, default: false

  belongs_to :user, class_name: 'User'
  validates :order, presence: true
  validates :path, presence: true

  index({ user_id: 1, path: 1, order: 1 }, { unique: true, background: true })

  after_destroy :remove_from_parent

  def child_notes_json
    # TODO: can be used when frontend requests data for any non-root note and its tree
    []
  end

  # Corrects the field 'order' for siblings which come after a note.
  # We're not deleting any of its children because its the client app's responsibility...
  # ...to assign them new parents or delete them separately
  def remove_from_parent
    Note.correct_orders_for_siblings(user_id, path, order, true)
  end

  # Assuming the note_id we're passing does not exist and was previously deleted
  # this cleans up ghost notes with dead parent_ids in their path
  def self.delete_children_tree(note_id)
    Note.where(path: /#{note_id}/).destroy_all
  end

  # Adds a child to a parent note
  # If the note to add has a valid id, just change the path & index for that note
  # If the note has a temp_id generated by client, create a new note
  # The note to add may have children, some with a valid id and some with a temp one.
  def self.add_new_child_tree(user_id, parent_id, index, note_id, fields, index_path, new_note_ids)
    note_path = get_note_path(parent_id)
    note_fields = get_note_fields_for(index, note_path, fields)
    correct_orders_for_siblings(user_id, note_path, index, false)
    current_note = add_or_update_note(note_id, note_fields, user_id, index_path, new_note_ids)

    # recursively call this fn if fields has any child_notes
    if fields[:child_notes]&.length&.positive?
      fields[:child_notes].each_with_index do |note, child_index|
        add_new_child_tree(user_id, current_note.id, child_index, note[:id], note,
                           index_path.dup.push(child_index), new_note_ids)
      end
    end

    new_note_ids
  end

  # returns notes for a user in a format that the client apps can easily use
  def self.root_notes_json(user_id)
    notes = User.find(user_id).notes.order_by(path: :asc, order: :asc)

    # the fn assumes that the notes are returned sorted by level in the tree
    notes = notes.sort { |note1, note2| note1.path.size <=> note2.path.size }

    json = {}
    notes.each do |note|
      note_json = { content: note.content, child_notes: {}, collapsed: note.collapsed }
      if note.path == '/'
        json[note.id.to_s] = note_json
      elsif json
        parent = json
        parent_ids = note.path.delete_prefix('/').split('/')
        parent_ids.each do |note_id|
          if parent && parent[:child_notes] && parent[:child_notes][note_id.to_s]
            parent = parent[:child_notes][note_id.to_s]
          elsif parent && parent[note_id.to_s]
            parent = parent[note_id.to_s]
          end
        end
        parent[:child_notes][note.id.to_s] = note_json if parent && parent[:child_notes]
      end
    end
    get_notes_as_arrays(json)
  end

  def self.apply_delete_transactions(transactions)
    # TODO: use bulk delete instead of individual deletes
    transactions.each do |transaction|
      if transaction[:id] && !transaction[:id].to_s.starts_with?('temp')
        Note.find(transaction[:id]).destroy
      end
    end
  end

  def self.apply_update_transactions(transactions)
    transactions.each do |transaction|
      note = Note.find(transaction[:id])
      fields_to_update = {}
      transaction[:fields].each_key do |key|
        fields_to_update[key] = transaction[:fields][key]
      end
      note.update(fields_to_update)
    end
  end

  def self.apply_add_transactions(transactions, user_id)
    new_note_ids = []
    transactions.each do |transaction|
      add_new_child_tree(
        user_id,
        transaction[:parent_id],
        transaction[:index],
        transaction[:id],
        transaction[:fields],
        transaction[:indexPath],
        new_note_ids
      )
    end
    new_note_ids
  end

  def self.get_notes_as_arrays(notes)
    res = []
    notes.each_key do |key|
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
  def self.correct_orders_for_siblings(user_id, path, index, move_left)
    siblings = Note.where(user_id: user_id, path: path, 'order' => { '$gte' => index })

    # make sure you're not violating the unique index on (:path, :order)
    siblings.public_send(move_left ? :each : :reverse_each) do |sibling|
      if sibling
        new_order = move_left ? sibling.order - 1 : sibling.order + 1
        sibling.update(order: new_order)
      end
    end
  end

  def self.add_or_update_note(note_id, note_fields, user_id, index_path, new_note_ids)
    if note_id.starts_with?('temp')
      note_fields[:user_id] = user_id
      current_note = Note.create(note_fields)
      new_note_ids.push({ indexPath: index_path.dup, note_id: current_note.id.to_s })
    else
      current_note = Note.find(note_id)
      current_note.update(note_fields)
    end
    current_note
  end

  def self.get_note_path(parent_id)
    note_path = '/'
    if parent_id && parent_id != 'root'
      parent = Note.find(parent_id)
      note_path = parent.path + "#{parent.id}/"
    end
    note_path
  end

  def self.get_note_fields_for(index, note_path, fields)
    note_fields = {
      order: index,
      path: note_path
    }
    fields.each_key do |key|
      note_fields[key] = fields[key] if key.in?(%w[content collapsed])
    end
    note_fields
  end
end
