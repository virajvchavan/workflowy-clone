require 'rails_helper'
require 'database_cleaner/mongoid'
include RequestSpecHelper

DatabaseCleaner[:mongoid].strategy = :truncation

RSpec.describe "Notes API", type: :request do
  before(:all) do
    @user = User.create(name: "Test", email: "t@t.com", password: "password")
  end

  after(:all) do
   DatabaseCleaner.clean()
  end

  it "gives 401 response for notes#index when no auth_token provided" do
    get '/api/notes'
    expect(response).to have_http_status(401)
  end

  it 'gives 200 response for notes#index when user is correct auth_token provided' do
    jwt = login_user(@user)
    get '/api/notes', headers: { "Authorization" => "Bearer #{jwt}" }
    expect(response).to have_http_status(200)
  end

  it 'creates a new note correctly for a "created" transaction' do
    jwt = login_user(@user)
    transactions = {
      added: [{
        id: "temp_id",
        index: 1,
        parent_id: "root",
        fields: { content: "two", collapsed: false, id: "2", child_notes: [] },
        indexPath: [1]
      }],
      deleted: [],
      updated: []
    }
    post '/api/notes/process_transactions', headers: { "Authorization" => "Bearer #{jwt}", 'Content-Type': 'application/json' }, params: transactions.to_json
    expect(response).to have_http_status(200)
    @user.reload
    user_notes = @user.notes
    expect(user_notes.count).to eq(1)
    new_note = user_notes.first
    expect(new_note.content).to eq("two")
  end

end
