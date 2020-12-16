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
    params[:deleted].each do |transaction|
      if transaction[:id] && !transaction[:id].to_s.starts_with?("temp")
        Note.find(transaction[:id]).destroy
      end
    end

    params[:updated].each do |transaction|
      note = Note.find(transaction[:id])
      fields_to_update = {}
      transaction[:fields].keys.each do |key|
        fields_to_update[key] = transaction[:fields][key]
      end
      note.update(fields_to_update)
    end

    new_note_ids = []
    params[:added].each do |transaction|
      Note.add_new_child_tree(
        @current_user.id,
        transaction[:parent_id],
        transaction[:index],
        transaction[:id],
        transaction[:fields],
        transaction[:indexPath],
        new_note_ids
      )
    end

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
