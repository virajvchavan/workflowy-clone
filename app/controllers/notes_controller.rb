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
  def process_transactions
    params[:deleted].each do |transaction|
      Note.find(transaction[:id]).destroy
    end

    params[:updated].each do |transaction|
      note = Note.find(transaction[:id])
      fields_to_update = {}
      transaction[:fields].keys.each do |key|
        fields_to_update[key] = transaction[:fields][key]
      end
      note.update(fields_to_update)
    end

    params[:added].each do |transaction|
      Note.add_new_child_tree(
        @current_user.id,
        transaction[:parent_id],
        transaction[:index],
        transaction[:id],
        transaction[:fields]
      )
    end

    render json: { status: "suceess" }
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
