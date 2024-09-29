module Wrapper exposing (..)

import Browser
import Html exposing (Html, div, hr, node, text)
import Html.Attributes exposing (attribute)


main : Program Flags Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


type alias Model =
    { appId : String
    , slotId : String
    }


type alias Flags =
    { appId : String
    , slotId : String
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { appId = flags.appId
      , slotId = flags.slotId
      }
    , Cmd.none
    )


type Msg
    = NoOp


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            ( model, Cmd.none )


view : Model -> Html Msg
view model =
    div []
        [ text "Hello from Elm Application. The slot starts here."
        , hr [] []
        , viewSlot model.appId model.slotId
        , hr [] []
        , text "The elm application finishes here."
        ]


viewSlot : String -> String -> Html msg
viewSlot appId slotName =
    node "elm-slot" [ attribute "app" appId, attribute "slot" slotName ] []


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none
