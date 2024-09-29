defmodule LiveElmExperiments.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      LiveElmExperimentsWeb.Telemetry,
      {DNSCluster,
       query: Application.get_env(:live_elm_experiments, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: LiveElmExperiments.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: LiveElmExperiments.Finch},
      # Start a worker by calling: LiveElmExperiments.Worker.start_link(arg)
      # {LiveElmExperiments.Worker, arg},
      # Start to serve requests, typically the last entry
      LiveElmExperimentsWeb.Endpoint,
      %{
        id: NodeJS,
        start: {NodeJS, :start_link, [[path: Path.absname("./assets/module"), pool_size: 4]]}
      }
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: LiveElmExperiments.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    LiveElmExperimentsWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
