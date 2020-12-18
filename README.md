Deployed here: https://moar-notes.herokuapp.com

> A productivity app to keep your thoughts organized. Take notes as an infinite, collapsable bullet list. 
> (Or a poor Workflowy clone)

## Tech stack
    - Backend: A Ruby on Rails REST API
    - Database: MongoDB with the Mongoid ORM
    - Frontend: A React App used with TypeScript
    - Deployment: React code is built & copied to the Rails /public folder & deployed on a single server using Heroku.

## Features
    - Create an account & log-in.
    - Create an infinitely nested list of bullet points.
    - Changes are synced with the server in almost real-time.
    - Collapse/expand any note with child notes
#### Keyboard shortcuts
- `Enter` -> Adds a new note below the currently focused note.
- `Tab` -> Indents a note towards right
- `Shift` + `Tab` -> Indents a note towards left
- `Backspace` when empty -> Deletes a note. If it has any chlid_notes, they're added to the parent of the deleted note.
- `UpArrow` + `DownArrow` -> Navigate up and down using the arrow keys
- `Ctrl` + `B` -> Make the text **bold**
- `Ctrl` + `I` -> Make the text *italicized*
- `Ctrl` + `U` -> Make the text Underlined

## **Architecture overview**
### **Server**
- A User has_many Notes
- Notes Model
    - To maintain a tree-like structure between the notes, I'm using a pattern called **Materialized Paths** (http://learnmongodbthehardway.com/schema/categoryhierarchy/)
    - Each note has a field called `path` which stores the path of ids of all its parents.
    - To maintain the sequence of notes, we're using a number field calleed `order`
    - This allows us to fetch all notes of a user in a single query.
    - We can also do queries like fetching the subtree of any note in a single query.
    - To maintain the integrity of sequencing and improve performance a MongoDB `unique index` is added for `{ user_id: 1, path: 1, order: 1 }`
- Authentication
    - Password based authentication
    - Uses `has_secure_password` by Rails for storing password
    - Sends a Json Web Token to the client
    - The client send the JWT with each api call
- Sever APIs
    - POST /users -> register a user, returns an auth_token
    - POST /users/login -> login a user, returns an auth_token
    - GET /users/auto_login -> checks if an auth_token sent with the api call is valid
    - GET /notes -> returns notes in the form of a nested json for the authenticated user
    - POST /notes/process_transactions -> applies the transactions sent by the client on the database & returns newly created note_ids

### **Frontend**
- The core component is `RootNote`. It has all the core logic to handle various features.
- The component called `Note` has the bare minumum each single note needs. It is rendered for every single bullet point.
- The `serverApis.tsx` handles the communication with the user.
- The utils.tsx module deals with creating transactions for changes made by the user.
- Changes to the server are sent when the user hasn't typed anything for 4 seconds.
- In the state, we store `sycnedNotes` & `notes`.
    - `notes` has the state sycned with what user types at all time
    - `sycnedNotes` has the notes that are in sync with the server
    - When the user hasn't typed anything for 4 seconds, the two are compared to find the changes to be sent to the server.
- The changes are sent to the server in the form of transactions. Transactions may be of type `added`, `updated`, `deleted`, or `moved`
    - The server returns the ids for the newly created notes, which are then put in the `notes` & `syncedNotes`.
    - `sycnedNotes` are updated every time the api is called and gives 200 status response.
- The libraries used:
    - `immer` for ease with immutable objects
    - `jsondiffpatch` for comparing the old and the new state
    - `react-contenteditable`

## How upcoming features can be implemented:
> Most of these require changes in the frontend and minimal changes on the server
1. **Zooming in on a specific note**
    - We should be able to open any bullet point on its own. Changes will be in the frontend, minimal changes in the server. The server already has the support for returning child_tree for any note.
2. **Undoing & Redoing capabilities**
    - Can be handled entirely on the frontend. Can store user's actions in react state and use it to undo & redo changes. The existing logic for diffing and creating transactions will not change.
3. **Tagging**
    - The current architecure can be extended to add a new field and make changes to the frontend to show tags for a note and show all notes for a tag. (Not sure if the list of notes for a tag should be fetched from local state or from an server API)
4. **Searching**
    - Can create an API on the server that can do fuzzy search on all the content in the notes.
    - Can use a full-text search engine like ElasticSearch to index the content. (MogoDB's text-search may work as well, need to research)
    - The frontend app needs to come up with a way to show the search result from the existing state.
5. **Drag and drop notes**
    - Can use some library to handle drag and drop UX, and the handler will change the react state for notes. No other changes are expected.
6. **Paste outline notes copied from somewhere else and preserve the structure**
    - Can attach an `onPaste` handler which will parse the pasted data, and understand the structure of the data and modify the react state.
7. **Select and copy multiple notes with its structure**
    - Add handlers to select multiple notes, and a way to generate structured outline data from it.
8. **Warn user when she's closing tab before all changes are synced**
9. **`Expand All` & `Collapse All` buttons**
9. **Offline support**
    - Can make it Progressive Web App.
    - Need to store the state locally. `IndexedDB` can be a good option to store it.
10. **Real-time synchronization between multiple instances of clients**
    - Can use Websockets to make it work.
    - The current transactions pattern should make it easy to sync the data reliably.
11. **Adding other authentication methods using OAuth2**
12. **Optimizing for large amounts of data**
13. **Making certain page public**
    - Easy to implement. Can add caching for these notes
14. **Better support for mobile phone**
    - Can add extra buttons that'll stick at the bottom for indending the notes left & right

## Why didn't I use Redux, GraphQL, or some other tech that could've suited better?
- While Redux/GraphQL would have been a great choices for the project, due to lock of time, my experience with both was limited, and using them would've meant spending more time learning these instead of implementing the features of the app.
- Hence I avoided using any tech that I was not already proficient in to minimize the time spent in learning it / fixing bugs.

## Automated Testing
- Using `react-testing-library` with `jest` for unit and integration tests.
- Most of the code for the core features is covered by integrated tests.
- Didn't do a lot of unit tests due to a lack of time, but if this project was to be used by real users, I would add some essential unit tests before making it live.
- Also skipped tests for some frontend code for non-core features (Login/Regsiter pages) because of the same reason.
- Test coverage: backend: `rake stats` , frontend: `cd client && npm test -- --coverage --watchAll=false`
------------------------------
## **Running it locally**
### First time setup:
- Add following mandatory credentials using `bin/rails credentials:edit`
    - mongo_url
    - mongo_url_test
- Run `bundle install && cd client && npm install`

### Run:
- Run `rails s -p 3001` in one terminal and in the another terminal you can do `cd client && npm start`
    - If you have heroku cli installed, - Run `heroku local -f Procfile.dev`

- Run tests:
    - `bundle exec rspec spec`
    - `rake stats` -> check test coverage
    - `cd client && npm run test`

### Rails credentials
- edit: `bin/rails credentials:edit`
- access in code: `Rails.application.credentials.cred_name`
- production environment should get the correct master key ENV["RAILS_MASTER_KEY"]

### Deploying
- Automatic deploys are enabled for this repo on the branch `main`
- To deploy manually: `git push heroku main`
- To view production logs: `heroku logs --tail`
