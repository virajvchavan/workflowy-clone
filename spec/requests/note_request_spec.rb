require 'rails_helper'
require 'database_cleaner/mongoid'
include RequestSpecHelper

DatabaseCleaner[:mongoid].strategy = :truncation, { except: ["users"] }

RSpec.describe "Notes API", type: :request do
  before(:all) do
    @user = User.create(name: "Test", email: "t@t.com", password: "password")
  end

  after(:each) do
   DatabaseCleaner.clean()
  end

  after(:all) do
    User.destroy_all
  end

  context "listing notes api" do
    it "gives 401 response for notes#index when no auth_token provided" do
      get '/api/notes'
      expect(response).to have_http_status(401)
    end

    it 'gives 200 response for notes#index when user is correct auth_token provided' do
      jwt = login_user(@user)
      get '/api/notes', headers: { "Authorization" => "Bearer #{jwt}" }
      expect(response).to have_http_status(200)
    end

    it 'renders notes in correct json structure for GET /notes' do
      jwt = login_user(@user)
      note1 = @user.notes.create(content: "hey", collapsed: false, path: "/", order: 0)
      note2 = @user.notes.create(content: "hey2", collapsed: false, path: "/#{note1.id.to_s}/", order: 0)
      note3 = @user.notes.create(content: "hey3", collapsed: false, path: "/#{note1.id.to_s}/", order: 1)
      note5 = @user.notes.create(content: "hey.1", collapsed: false, path: "/", order: 1)
      get '/api/notes', headers: { "Authorization" => "Bearer #{jwt}" }
      expect(json.map {|i| i.deep_symbolize_keys}).to eq([
        {
          "id": note1.id.to_s,
          "content": note1.content,
          "collapsed": note1.collapsed,
          "child_notes": [
            {
              "id": note2.id.to_s,
              "content": note2.content,
              "collapsed": note2.collapsed,
              "child_notes": []
            },
            {
              "id": note3.id.to_s,
              "content": note3.content,
              "collapsed": note3.collapsed,
              "child_notes": []
            }
          ]
        },
        {
          "id": note5.id.to_s,
          "content": note5.content,
          "collapsed": note5.collapsed,
          "child_notes": []
        }
      ])
    end
  end

  context "creating notes through transactions api" do
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

    it 'correct "order" field for siblings for a "created" transaction with parent root' do
      jwt = login_user(@user)
      note1 = @user.notes.create(content: "hey", collapsed: false, path: "/", order: 0)
      note2 = @user.notes.create(content: "hey2", collapsed: false, path: "/", order: 1)
      note3 = @user.notes.create(content: "hey3", collapsed: false, path: "/", order: 2)
      transactions = {
        added: [{
          id: "temp_id",
          index: 1,
          parent_id: "root",
          fields: { content: "randomNote", collapsed: false, id: "temp_id", child_notes: [] },
          indexPath: [1]
        }],
        deleted: [],
        updated: []
      }
      post '/api/notes/process_transactions', headers: { "Authorization" => "Bearer #{jwt}", 'Content-Type': 'application/json' }, params: transactions.to_json
      expect(response).to have_http_status(200)
      @user.reload

      expect(Note.find(note2.id).order).to eq(2)
      expect(Note.find(note3.id).order).to eq(3)
      expect(Note.find_by(content: "randomNote").order).to eq(1)
    end

    it 'correct "order" field for siblings for a "created" transaction with parent is not root' do
      jwt = login_user(@user)
      note1 = @user.notes.create(content: "hey", collapsed: false, path: "/", order: 0)
      note2 = @user.notes.create(content: "hey2", collapsed: false, path: "/#{note1.id}/", order: 0)
      note3 = @user.notes.create(content: "hey3", collapsed: false, path: "/#{note1.id}/", order: 1)
      note4 = @user.notes.create(content: "hey4", collapsed: false, path: "/#{note1.id}/", order: 2)
      transactions = {
        added: [{
          id: "temp_id",
          index: 1,
          parent_id: note1.id.to_s,
          fields: { content: "randomNote1", collapsed: false, id: "temp_id", child_notes: [] },
          indexPath: [1]
        }],
        deleted: [],
        updated: []
      }
      post '/api/notes/process_transactions', headers: { "Authorization" => "Bearer #{jwt}", 'Content-Type': 'application/json' }, params: transactions.to_json
      expect(response).to have_http_status(200)

      expect(note3.reload.order).to eq(2)
      expect(note4.reload.order).to eq(3)
      expect(Note.find_by(content: "randomNote1").order).to eq(1)
    end
  end

  context "deleting notes through transactions" do
    it 'deletes a note correctly for a "deleted" transaction' do
      jwt = login_user(@user)
      note = @user.notes.create(content: "hey", collapsed: false, path: "/", order: 0)
      expect(@user.notes.where(id: note.id).length).to eq(1)
      transactions = {
        added: [],
        deleted: [{id: note.id.to_s}],
        updated: []
      }
      post '/api/notes/process_transactions', headers: { "Authorization" => "Bearer #{jwt}", 'Content-Type': 'application/json' }, params: transactions.to_json
      expect(response).to have_http_status(200)
      @user.reload
      expect(@user.notes.where(id: note.id).length).to eq(0)
    end

    it 'correct "order" field for siblings for a note parent root is deleted through transactions api with' do
      jwt = login_user(@user)
      note1 = @user.notes.create(content: "hey", collapsed: false, path: "/", order: 0)
      note2 = @user.notes.create(content: "hey2", collapsed: false, path: "/", order: 1)
      note3 = @user.notes.create(content: "hey3", collapsed: false, path: "/", order: 2)
      note4 = @user.notes.create(content: "hey4", collapsed: false, path: "/", order: 3)

      transactions = {
        added: [],
        deleted: [{id: note2.id.to_s}],
        updated: []
      }
      post '/api/notes/process_transactions', headers: { "Authorization" => "Bearer #{jwt}", 'Content-Type': 'application/json' }, params: transactions.to_json
      expect(response).to have_http_status(200)

      expect(note3.reload.order).to eq(1)
      expect(note4.reload.order).to eq(2)
    end

    it 'correct "order" field for siblings for a note parent is not root is deleted through transactions api with' do
      jwt = login_user(@user)
      note1 = @user.notes.create(content: "hey", collapsed: false, path: "/", order: 0)
      note2 = @user.notes.create(content: "hey2", collapsed: false, path: "/#{note1.id}/", order: 0)
      note3 = @user.notes.create(content: "hey3", collapsed: false, path: "/#{note1.id}/", order: 1)
      note4 = @user.notes.create(content: "hey4", collapsed: false, path: "/#{note1.id}/", order: 2)
      note5 = @user.notes.create(content: "hey5", collapsed: false, path: "/#{note1.id}/", order: 3)

      transactions = {
        added: [],
        deleted: [{id: note3.id.to_s}],
        updated: []
      }
      post '/api/notes/process_transactions', headers: { "Authorization" => "Bearer #{jwt}", 'Content-Type': 'application/json' }, params: transactions.to_json
      expect(response).to have_http_status(200)

      expect(note4.reload.order).to eq(1)
      expect(note5.reload.order).to eq(2)
    end
  end

  it 'updated fields for a note correctly for a "updated" transaction' do
    jwt = login_user(@user)
    note1 = @user.notes.create(content: "hey", collapsed: false, path: "/", order: 0)
    transactions = {
      added: [],
      deleted: [],
      updated: [{
        id: note1.id.to_s,
        fields: { content: "heyheyhey", collapsed: true }
      }]
    }
    post '/api/notes/process_transactions', headers: { "Authorization" => "Bearer #{jwt}", 'Content-Type': 'application/json' }, params: transactions.to_json
    expect(response).to have_http_status(200)

    user_notes = @user.notes
    note1.reload
    expect(note1.content).to eq('heyheyhey')
    expect(note1.collapsed).to eq(true)
  end
end
