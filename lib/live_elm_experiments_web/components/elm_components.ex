defmodule LiveElmExperimentsWeb.ElmComponents do
  use Phoenix.Component, global_prefixes: ~w(elm-)

  attr :id, :string, required: true
  attr :app, :string, required: true
  attr :rest, :global
  attr :ignore, :boolean, default: false

  slot :inner_block, required: false

  def elm(assigns) do
    # TODO: Make all html attributes go to wrapper;
    # TODO: Make all elm- attributes go to app
    assigns = assign(assigns, :phx_update, if(assigns.ignore, do: "ignore", else: "replace"))

    # This wrapper prevents the elm application being re-rendered every view.
    ~H"""
    <div id={"#{@id}-wrapper"} phx-update={@phx_update}>
      <div id={@id} phx-hook="ElmApp" elm-app={@app} {@rest}>
        <%= render_slot(@inner_block) %>
      </div>
    </div>
    """
  end
end
