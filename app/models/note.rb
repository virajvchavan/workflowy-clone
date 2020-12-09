class Note
  include Mongoid::Document
  field :content, type: String

  # stores the path from the root node
  field :path, type: String
  field :order, type: Integer
  field :collapsed, type: Boolean

  belongs_to :user, class_name: "User"

  def add_new_child(note_params)
    new_note = Note.new(note_params);
    new_note.user = self.user
    new_note.path = self.path + self.id.to_s + "/"
    new_note.save
  end

  def child_notes_json
    # todo
    []
  end

  def self.root_notes_json(user_id)
    notes = User.find(user_id).notes.order_by(path: :asc, order: :asc)
    json = {}
    notes.each do |note|
      if note.path == "/"
        json[note.id.to_s] = { content: note.content, child_notes: {} }
      else
        parent = json
        parent_ids = note.path.delete_prefix("/").split("/")
        parent_ids.each do |note_id|
          if (parent[:child_notes])
            parent = parent[:child_notes][note_id.to_s]
          else
            parent = parent[note_id.to_s]
          end
        end
        parent[:child_notes][note.id.to_s] = { content: note.content, child_notes: {} }
      end
    end
    get_notes_as_arrays(json)
  end

  private

  def self.get_notes_as_arrays(notes)
    res = []
    notes.keys.each do |key|
      res.push(notes[key].merge(id: key, child_notes: get_notes_as_arrays(notes[key][:child_notes])))
    end
    res
  end
end
