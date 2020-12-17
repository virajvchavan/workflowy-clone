require 'rails_helper'

RSpec.describe 'Users', type: :request do
  after(:all) do
    User.destroy_all
  end

  it 'creates a user for the (POST /users) API and return an auth_token' do
    post '/api/users',
         params: { user: { email: 'test@user.com', password: 'password', name: 'TestUser' } }
    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json).to include('token')
    expect(User.first.email).to eq('test@user.com')
  end

  it 'logs in a user & return the auth token for the login API' do
    post '/api/users/login', params: { user: { email: 'test@user.com', password: 'password' } }
    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json).to include('token')
  end

  it 'returns 401 for auto_login API if auth_token is wrong' do
    get '/api/users/auto_login', headers: { 'Authorization' => 'Bearer fakeToken' }
    expect(response).to have_http_status(:unauthorized)
  end

  it 'returns 200 for auto_login API if auth_token is correct' do
    post '/api/users/login', params: { user: { email: 'test@user.com', password: 'password' } }
    json = JSON.parse(response.body)

    get '/api/users/auto_login', headers: { 'Authorization' => "Bearer #{json['token']}" }
    expect(response).to have_http_status(:ok)
  end
end
