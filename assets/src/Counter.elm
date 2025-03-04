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
    , canNegative : Bool
    , prefix : String
    }


type alias Flags =
    { initialNumber : Int
    , canNegative : Bool
    , prefix : String
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { count = flags.initialNumber
      , canNegative = flags.canNegative
      , prefix = flags.prefix
      }
    , Cmd.none
    )


type Msg
    = Increment
    | Decrement


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    let
        count =
            case msg of
                Increment ->
                    model.count + 1

                Decrement ->
                    if model.canNegative then
                        model.count - 1

                    else
                        max (model.count - 1) 0
    in
    ( { model | count = count }, numberChanged count )


view : Model -> Html Msg
view model =
    div []
        [ button [ onClick Decrement ] [ text "-" ]
        , div []
            [ text model.prefix
            , text " "
            , text (String.fromInt model.count)
            ]
        , button [ onClick Increment ] [ text "+" ]
        ]


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none
