/**
 * GraphQL Fragment Registry
 * Pre-defined fragments for common content types
 */

// Fragment definitions for polymorphic types
export const FRAGMENTS = {
  // Component fragments
  Hero: `
    fragment HeroFields on Hero {
      _id
      Heading
      SubHeading
      Body
      Image {
        key
        url {
          default
        }
      }
      Video {
        key
        url {
          default
        }
      }
      Links {
        text
        url {
          default
        }
      }
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  Card: `
    fragment CardFields on Card {
      _id
      Heading
      SubHeading
      Body
      Asset {
        key
        url {
          default
        }
      }
      Links {
        text
        url {
          default
        }
      }
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  Button: `
    fragment ButtonFields on Button {
      _id
      ButtonLabel
      ButtonLink {
        text
        url {
          default
        }
      }
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  ArticleList: `
    fragment ArticleListFields on ArticleList {
      _id
      Title
      NumberOfArticles
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  Paragraph: `
    fragment ParagraphFields on Paragraph {
      _id
      Body
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  Image: `
    fragment ImageFields on Image {
      _id
      AltText
      Image {
        key
        url {
          default
        }
      }
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  Video: `
    fragment VideoFields on Video {
      _id
      Title
      Video {
        key
        url {
          default
        }
      }
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  Carousel: `
    fragment CarouselFields on Carousel {
      _id
      Heading
      Assets {
        text
        url {
          default
        }
      }
      Link {
        text
        url {
          default
        }
      }
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  Grid: `
    fragment GridFields on Grid {
      _id
      Items {
        _id
        __typename
      }
      RichText
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  CallToAction: `
    fragment CallToActionFields on CallToAction {
      _id
      Links {
        text
        url {
          default
        }
      }
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  Collapse: `
    fragment CollapseFields on Collapse {
      _id
      Heading
      Body
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  Divider: `
    fragment DividerFields on Divider {
      _id
      DividerDirection
      DividerText
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  Text: `
    fragment TextFields on Text {
      _id
      Body
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  Iframe: `
    fragment IframeFields on Iframe {
      _id
      Title
      IframePageUrl
      Width
      ManualHeight
      _metadata {
        displayName
        key
        types
      }
    }
  `,

  // Page fragments
  ArticlePage: `
    fragment ArticlePageFields on ArticlePage {
      _id
      Heading
      SubHeading
      Author
      AuthorEmail
      Body
      PromoImage {
        key
        url {
          default
        }
      }
      _metadata {
        displayName
        key
        url {
          default
        }
        types
      }
    }
  `,

  LandingPage: `
    fragment LandingPageFields on LandingPage {
      _id
      MainContentArea {
        _id
        __typename
      }
      TopContentArea {
        _id
        __typename
      }
      _metadata {
        displayName
        key
        url {
          default
        }
        types
      }
    }
  `,

  Product: `
    fragment ProductFields on Product {
      _id
      Title
      Description
      Price
      Image {
        key
        url {
          default
        }
      }
      _metadata {
        displayName
        key
        types
      }
    }
  `,
} as const

export type FragmentName = keyof typeof FRAGMENTS

/**
 * Get fragment definition by name
 */
export function getFragment(name: string): string | undefined {
  return FRAGMENTS[name as FragmentName]
}

/**
 * Get multiple fragments
 */
export function getFragments(names: string[]): string[] {
  return names
    .map(name => getFragment(name))
    .filter((fragment): fragment is string => fragment !== undefined)
}

/**
 * Check if a fragment exists
 */
export function isValidFragment(name: string): name is FragmentName {
  return name in FRAGMENTS
}

/**
 * Get all available fragment names
 */
export function getAvailableFragments(): FragmentName[] {
  return Object.keys(FRAGMENTS) as FragmentName[]
}

/**
 * Build inline fragments for polymorphic fields
 * Used when querying fields like MainContentArea: [_IContent]
 */
export function buildInlineFragments(fragmentNames: string[]): string {
  const fragments = getFragments(fragmentNames)

  return fragments
    .map(fragment => {
      // Extract the fragment content (remove the fragment declaration)
      const match = fragment.match(/fragment \w+ on (\w+) \{([\s\S]*)\}/)
      if (!match) return ''

      const [, typeName, fields] = match
      return `... on ${typeName} {${fields}}`
    })
    .filter(Boolean)
    .join('\n      ')
}
