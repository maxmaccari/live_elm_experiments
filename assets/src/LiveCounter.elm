port module LiveCounter exposing (..)

import Browser
import Html exposing (Html, button, div, h1, p, text)
import Html.Attributes exposing (class)
import Html.Events exposing (onClick)


port numberChangeClicked : Int -> Cmd msg


port onUpdateNumber : (Int -> msg) -> Sub msg


port onUpdate : (Flags -> msg) -> Sub msg


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
    let
        _ =
            Debug.log "Flags" flags
    in
    ( { count = flags.initialNumber }
    , Cmd.none
    )


type Msg
    = Increment
    | Decrement
    | SetNumber Int
    | Update Flags


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Increment ->
            ( model, numberChangeClicked 1 )

        Decrement ->
            ( model, numberChangeClicked -1 )

        SetNumber newCount ->
            ( { model | count = newCount }, Cmd.none )

        Update flags ->
            init flags


view : Model -> Html Msg
view model =
    div []
        [ h1 [ class "text-xl" ] [ text "Counter from Elm: " ]
        , div [ class "flex mt-2" ]
            [ button [ onClick Decrement, class "px-2 py-1 bg-blue-500 hover:bg-blue-300 text-white" ] [ text "-" ]
            , div [ class "ml-2 text-xl font-bold" ] [ text (String.fromInt model.count) ]
            , button [ onClick Increment, class "px-2 py-1 bg-blue-500 hover:bg-blue-300 text-white ml-2" ] [ text "+" ]
            ]
        ]


subscriptions : Model -> Sub Msg
subscriptions _ =
    onUpdateNumber SetNumber
