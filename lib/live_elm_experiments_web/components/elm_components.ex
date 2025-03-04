defmodule LiveElmExperimentsWeb.ElmComponents do
  use Phoenix.Component

  attr :id, :string, required: true
  attr :app, :string, required: true
  attr :rest, :global
  attr :rerender_on_updates, :boolean, default: false

  slot :inner_block, required: false

  def elm(assigns) do
    assigns =
      assigns
      |> assign(:phx_update, if(assigns.rerender_on_updates, do: "replace", else: "ignore"))
      |> assign(:elm_element_id, "#{assigns.id}--app")
      |> assign(:slots_element_id, "#{assigns.id}--slots")
      |> flags_to_json()

    # This wrapper prevents the elm application being re-rendered every view.
    ~H"""
    <div id={@id} elm-app={@app} phx-hook="ElmApp" {@rest}>
      <div id={@elm_element_id} phx-update={@phx_update}></div>
      <div id={@slots_element_id} style="display:none">
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
