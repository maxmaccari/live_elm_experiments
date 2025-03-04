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

    # The elm application will ever being rendered on the first slot. User may decide
    # if the application will be re-rendered on updates, or if it will handle the updates.
    # The slots are always included in the last child element.
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
