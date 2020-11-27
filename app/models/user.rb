class User
  include Mongoid::Document
  include ActiveModel::SecurePassword

  field :email, type: String
  field :password, type: Digest
  has_secure_password

  field :password_digest, type: String

  validates :email, :presence => true
  index({ email: 1 }, { unique: true, name: "email_index" })

end
