Deployed here: https://blooming-taiga-58696.herokuapp.com/

### Rails credentials
- edit: `bin/rails credentials:edit`
- access in code: `Rails.application.credentials.cred_name`
- production environment should get the correct master key ENV["RAILS_MASTER_KEY"]

### Run locally
- add following mandatory credentials using `bin/rails credentials:edit`
    - mongo_url
    - mongo_url_test
- Run `bundle install && cd client && npm install`
- Run `rails s -p 3001` in one terminal and in the another terminal you can do `cd client && npm start`
    - If you have heroku cli installed, - Run `heroku local -f Procfile.dev`

### Deploying
- Automatic deploys are enabled for this repo on the branch `main`
- To deploy manually: `git push heroku main`
- To view production logs: `heroku logs --tail`
