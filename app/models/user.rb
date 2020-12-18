# frozen_string_literal: true

class User
  include Mongoid::Document
  include ActiveModel::SecurePassword

  field :name, type: String
  field :email, type: String
  field :password, type: Digest
  has_secure_password

  field :password_digest, type: String

  has_many :notes, dependent: :destroy

  validates :email, presence: true
  index({ email: 1 }, { unique: true, name: 'email_index' })

  after_create :add_initial_notes

  def id
    _id.to_s
  end

  def add_initial_notes
    path = File.join(Rails.root, "app/seeds/initialNotes.json")
    new_notes = JSON.parse(File.read(path))
    import_notes_from_json(new_notes, "/", nil)
  end

  private

  # don't call this when a user already has notes, otherwise it'll mess up the sequence of notes
  # TODO: fix: this methos is not performant. Makes one insert db query for each single note
  # TODO: Either run this in background or do some sort of performant bulk insert
  def import_notes_from_json(new_notes, path, parent)
    path = path + "#{parent.id.to_s}/" if parent
    new_notes.each_with_index do |note_data, index|
      added_note = self.notes.create(
        content: note_data['content'],
        collapsed: note_data['collapsed'] || false,
        path: path,
        order: index
      )
      if (note_data['child_notes'] && note_data['child_notes'].length > 0)
        import_notes_from_json(note_data['child_notes'], path, added_note)
      end
    end
  end
end
