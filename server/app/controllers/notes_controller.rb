# frozen_string_literal: true

class NotesController < ApiController
  before_action :authenticate_request!

  # GET /notes
  def index
    render json: Note.root_notes_json(@current_user.id)
  end

  # POST /notes/process_transactions
  def process_transactions
    # this action can be improved later:
    #  -> Send newly added ids as soon as possible and
    #  -> process the updates and delete_children_tree in background
    Note.apply_delete_transactions(params[:deleted])
    Note.apply_update_transactions(params[:updated])
    new_note_ids = Note.apply_add_transactions(params[:added], @current_user.id)

    # if there are any ghost children remaining (notes with a non-existing parent), delete those
    params[:deleted].each do |note_id|
      Note.delete_children_tree(note_id)
    end

    render json: { status: 'success', new_ids: new_note_ids }
  end
end
