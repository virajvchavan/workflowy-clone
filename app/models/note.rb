class Note
  include Mongoid::Document
  field :content, type: String

  # stores the path from the root node
  field :path, type: String
  field :order, type: Integer

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
    User.find(user_id).notes
  end
end
