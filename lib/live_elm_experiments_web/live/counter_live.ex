defmodule LiveElmExperimentsWeb.CounterLive do
  use LiveElmExperimentsWeb, :live_view

  @impl true
  def mount(_params, _session, socket) do
    socket = assign(socket, count: 0)

    {:ok, socket}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <.elm id="wrapper" app="Wrapper">
      <div>
        <div class="flex items-center">
          <button class="px-2 py-1 bg-blue-500 hover:bg-blue-300 text-white" phx-click="dec">
            -
          </button>
          <div class="ml-2 text-xl font-bold"><%= @count %></div>
          <button class="ml-2 px-2 py-1 bg-blue-500 hover:bg-blue-300 text-white" phx-click="inc">
            +
          </button>
        </div>

        <div phx-hook="AHook" id="my-hook"></div>
      </div>
    </.elm>

    <hr class="my-6" />
    <.elm
      id="events-counter"
      app="LiveCounter"
      ignore={true}
      elm-flag:int:initial-number={@count}
      elm-on:number-change-clicked="update"
      elm-handle-event="update-number"
    />
    <p>This value is update from LiveView events</p>

    <hr class="my-6" />
    <.elm
      id="rerender-counter"
      app="LiveCounter"
      ignore={false}
      elm-flag:int:initial-number={@count}
      elm-on:number-change-clicked="update"
    />
    <p>This value is update through re-render</p>

    <hr class="my-6" />
    <.elm
      id="update-counter"
      app="LiveCounter"
      ignore={true}
      elm-flag:int:initial-number={@count}
      elm-on:number-change-clicked="update"
    />
    <p>This value is update through re-render</p>
    """
  end

  @impl true
  def handle_event("inc", _, socket) do
    count = socket.assigns.count + 1

    socket =
      socket
      |> push_event("update-number", %{value: count})
      |> assign(:count, count)

    {:noreply, assign(socket, :count, count)}
  end

  def handle_event("dec", _, socket) do
    count = socket.assigns.count - 1

    socket =
      socket
      |> push_event("update-number", %{value: count})
      |> assign(:count, count)

    {:noreply, socket}
  end

  def handle_event("update", %{"value" => inc}, socket) do
    count = socket.assigns.count + inc

    socket =
      socket
      |> push_event("update-number", %{value: count})
      |> assign(:count, count)

    {:noreply, socket}
  end
end
