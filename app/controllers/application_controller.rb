# frozen_string_literal: true

class ApplicationController < ActionController::Base
  def fallback_index_html
    render file: 'public/index.html'
  end
end
