require 'rails_helper'
include RequestSpecHelper

RSpec.describe "Notes API", type: :request do
  it "gives 401 response for notes#index when no auth_token provided" do
    get '/api/notes'
    expect(response).to have_http_status(401)
  end

  it 'gives 200 response for notes#index when user is correct auth_token provided' do
    user = User.create(name: "Test", email: "t@t.com", password: "password")
    jwt = login_user(user)
    get '/api/notes', headers: { "Authorization" => "Bearer #{jwt}" }
    expect(response).to have_http_status(200)
  end
end
