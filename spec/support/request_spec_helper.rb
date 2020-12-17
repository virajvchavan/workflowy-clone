module RequestSpecHelper
  def json
    JSON.parse(response.body)
  end

  def login_user(user)
    post '/api/users/login', params: { user: { email: user.email, password: 'password' } }
    json['token']
  end
end
