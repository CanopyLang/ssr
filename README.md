# canopy/ssr

Server-side rendering: VirtualDom-to-HTML with head management, Open Graph meta, and state hydration.

## Installation

```
canopy install canopy/ssr
```

## Core Concept

Server-side rendering produces a complete HTML document from a Canopy `Model` on the server before any JavaScript runs. The client receives pre-rendered HTML, displays it immediately, then hydrates — attaching the Canopy runtime to the existing DOM rather than rebuilding it from scratch.

`Ssr.renderPage` is a pure, synchronous function. All data must already be in the `Model` before rendering starts; there is no mechanism for the renderer to fetch data mid-render. Fetch everything you need, construct your model, then call `renderPage`.

## Quick Start

```canopy
import Ssr
import Ssr.Head as Head
import Ssr.Meta as Meta
import Ssr.Render as Render


renderNote : Route -> NoteModel -> Ssr.RenderResult
renderNote route model =
    let
        head =
            [ Head.title (model.note.title ++ " — Notes")
            , Head.meta "description" model.note.summary
            ]
                ++ Meta.openGraph
                    { title = model.note.title
                    , description = model.note.summary
                    , image = model.note.coverImage
                    , url = Route.toUrl route
                    , siteName = "Notes"
                    , type_ = Meta.Article
                    }
    in
    Ssr.renderPageWithHead route model head


-- Partial hydration: only the comment section is interactive
view : Model -> Html Msg
view model =
    Html.div []
        [ Html.article [] [ Html.text model.note.body ]
        , Ssr.Island.island "comment-section" model.comments commentView
        ]
```

## API Summary

### Ssr

| Function | Signature | Description |
|---|---|---|
| `renderPage` | `Route -> Model -> RenderResult` | Render a page to HTML with no explicit head elements |
| `renderPageWithHead` | `Route -> Model -> Head -> RenderResult` | Render a page to HTML with a supplied list of head elements |

### Ssr.Head

| Function | Signature | Description |
|---|---|---|
| `title` | `String -> HeadElement` | Set the document `<title>` |
| `meta` | `String -> String -> HeadElement` | Emit a `<meta name="..." content="...">` element |
| `link` | `String -> String -> HeadElement` | Emit a `<link rel="..." href="...">` element |
| `script` | `String -> HeadElement` | Emit a `<script src="...">` element |

### Ssr.Meta

| Function | Signature | Description |
|---|---|---|
| `openGraph` | `OpenGraphData -> List HeadElement` | Produce the full set of `og:` meta tags for a page |
| `twitterCard` | `TwitterCardData -> List HeadElement` | Produce Twitter/X card meta tags |

### Ssr.Static

Render a page to a static HTML file with no hydration marker. Useful for pages with no interactive components.

### Ssr.Island

| Function | Signature | Description |
|---|---|---|
| `island` | `String -> a -> (a -> Html msg) -> Html msg` | Mark a subtree for client-side hydration while rendering the rest statically |

### Ssr.Stream

Streaming HTML output for large pages. Emits the `<head>` and above-the-fold content first, then flushes the remainder.

## Types

| Type | Fields | Description |
|---|---|---|
| `RenderResult` | `html`, `head`, `state`, `statusCode`, `headers` | Everything needed to write an HTTP response |
| `SsrError` | `RouteNotFound`, `RenderError`, `SerializationError` | Failure modes from `renderPage` |

## Gotchas

**`renderPage` is synchronous — pre-fetch all data.** The renderer has no ability to perform effects. If your model is missing data at render time, the rendered HTML will be incomplete. Resolve all data dependencies before constructing the model you pass to `renderPage`.

**Your Model must be fully JSON-encodable.** `RenderResult.state` contains the serialized model, which the client uses to initialize the Canopy runtime without re-fetching. Any field that cannot be encoded to JSON will cause a `SerializationError`. Use `Json.Codec` throughout your model types.

**Only `island`-wrapped components are hydrated.** By default, the entire rendered page is static HTML after the initial load. Wrap interactive sections in `Ssr.Island.island` to opt them into client-side Canopy hydration. The string identifier must be unique within the page.

## License

BSD-3-Clause
