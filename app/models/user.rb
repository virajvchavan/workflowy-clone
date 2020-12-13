class User
  include Mongoid::Document
  include ActiveModel::SecurePassword

  field :name, type: String
  field :email, type: String
  field :password, type: Digest
  has_secure_password

  field :password_digest, type: String

  has_many :notes

  validates :email, :presence => true
  index({ email: 1 }, { unique: true, name: "email_index" })

  def id
    _id.to_s
  end

end
