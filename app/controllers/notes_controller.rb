class NotesController < ApiController
  before_action :authenticate_request!
  before_action :set_note, only: [:show, :update, :destroy]

  # GET /notes
  def index
    @notes = Note.root_notes_json(@current_user.id)

    render json: @notes
  end

  # GET /notes/1
  def show
    render json: @note
  end

  # POST /notes
  def create
    @note = Note.new(note_params)
    @note.user = @current_user
    if @note.save
      render json: @note, status: :created
    else
      render json: @note.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /notes/1
  def update
    if @note.update(note_params)
      render json: @note
    else
      render json: @note.errors, status: :unprocessable_entity
    end
  end

  # DELETE /notes/1
  def destroy
    @note.destroy
  end

  # POST /notes/process_transactions
  # this action can be improved later: Send newly added ids as soon as possible and process the updates and delete_children_tree in background
  def process_transactions
    Note.apply_delete_transactions(params[:deleted])
    Note.apply_update_transactions(params[:updated])
    new_note_ids = Note.apply_add_transactions(params[:added], @current_user.id)

    # if there are any ghost children remaining (notes with a non-existing parent), delete those
    params[:deleted].each do |note_id|
      Note.delete_children_tree(note_id)
    end

    render json: { status: "success", new_ids: new_note_ids }
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_note
      @note = Note.find(params[:id])
    end

    # Only allow a trusted parameter "white list" through.
    def note_params
      params.require(:note).permit(:content, :path, :order)
    end
end
