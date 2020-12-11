Rails.application.routes.draw do
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html

  scope '/api' do
    resources :notes do
      collection do
        post 'process_transactions'
      end
    end

    resources :users, only: [:create] do
      collection do
        post 'login'
        get 'auto_login'
      end
    end
  end

  get '*path', to: "application#fallback_index_html", constraints: ->(request) do
    !request.xhr? && request.format.html?
  end
end
