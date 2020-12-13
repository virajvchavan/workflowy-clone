class UsersController < ApiController
  before_action :authenticate_request!, except: [:create, :login]

  def login
    user = User.where(email: user_params[:email].to_s.downcase).find_first

    if !user.nil? && user&.authenticate(user_params[:password])
      auth_token = JsonWebToken.encode(user_id: user.id.to_s)
      render json: { token: auth_token, name: user.name }, status: :ok
    else
      render json: { error: 'Invalid username/password' }, status: :unauthorized
    end
  end

  # client can call this to make sure the jwt token it has has not expired
  def auto_login
    render json: { status: "logged_in" }
  end

  # POST /users
  def create
    @user = User.new(user_params)

    if @user.save && @user.authenticate(user_params[:password])
      auth_token = JsonWebToken.encode(user_id: @user.id.to_s)
      render json: { token: auth_token, name: @user.name }, status: :ok
    else
      render json: @user.errors, status: :unprocessable_entity
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_user
      @user = User.find(params[:id])
    end

    # Only allow a trusted parameter "white list" through.
    def user_params
      params.require(:user).permit(:email, :password, :name)
    end
end
