port module Counter exposing (..)

import Browser
import Html exposing (Html, button, div, text)
import Html.Events exposing (onClick)


port numberChanged : Int -> Cmd msg


main : Program Flags Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


type alias Model =
    { count : Int
    }


type alias Flags =
    { initialNumber : Int
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { count = flags.initialNumber
      }
    , Cmd.none
    )


type Msg
    = Increment
    | Decrement


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Increment ->
            ( { model | count = model.count + 1 }, numberChanged (model.count + 1) )

        Decrement ->
            ( { model | count = model.count - 1 }, numberChanged (model.count - 1) )


view : Model -> Html Msg
view model =
    div []
        [ button [ onClick Decrement ] [ text "-" ]
        , div [] [ text (String.fromInt model.count) ]
        , button [ onClick Increment ] [ text "+" ]
        ]


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none
