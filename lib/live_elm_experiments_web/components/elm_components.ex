defmodule LiveElmExperimentsWeb.ElmComponents do
  use Phoenix.Component

  attr :id, :string, required: true
  attr :app, :string, required: true
  attr :rest, :global
  attr :ignore, :boolean, default: false

  slot :inner_block, required: false

  def elm(assigns) do
    # TODO: Make all html attributes go to wrapper;
    # TODO: Make all elm- attributes go to app
    assigns =
      assigns
      |> assign(:phx_update, if(assigns.ignore, do: "ignore", else: "replace"))
      |> assign(:app_id, "#{assigns.id}--app")
      |> assign(:slot_id, "#{assigns.id}--slots")
      |> flags_to_json()

    # This wrapper prevents the elm application being re-rendered every view.
    ~H"""
    <div id={@id} elm-app={@app} phx-hook="ElmApp" phx-update={@phx_update} {@rest}>
      <div id={@app_id}></div>
      <div id={@slot_id}>
        <%= render_slot(@inner_block) %>
      </div>
    </div>
    """
  end

  defp flags_to_json(assigns) do
    rest =
      assigns[:rest]
      |> Enum.map(fn {key, value} ->
        case Atom.to_string(key) do
          "elm-flag:" <> _ ->
            {key, Jason.encode!(value)}

          _ ->
            {key, value}
        end
      end)
      |> Enum.into(%{})

    assign(assigns, :rest, rest)
  end
end
