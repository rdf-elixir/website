module.exports = ctx => ({
  title: 'RDF on Elixir',
  description: 'Implementation of the Linked Data and Semantic Standards for Elixir',
  head: [
    ['link', { rel: 'manifest', href: '/icons/manifest.json' }],
    // For new browsers multisize ico
    ['link', { rel: 'icon', type: 'image/x-icon', sizes: '16x16 32x32', href: '/icons/favicon.ico' }],
    // Chrome for Android
    ['link', { rel: 'icon', sizes: '192x192', href: '/icons/favicon-192.png' }],
    // For iPhone 6+ downscaled for other devices
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/icons/favicon-180-precomposed.png' }],
    // For IE10 Metro
    ['meta', { name: 'msapplication-TileImage', content: '/icons/favicon-144.png' }],
    ['meta', { name: 'msapplication-TileColor', content: '#FFFFFF' }],

    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
  ],
  themeConfig: {
    repo: 'rdf-elixir/website',
    docsDir: 'content',
    editLinks: true,
    nav: getNav(),
    sidebar: getSidebar()
  },
  plugins: [
    ['@vuepress/active-header-links', {
      sidebarLinkSelector: '.sidebar-link',
      headerAnchorSelector: '.header-anchor'
    }],
    ['@vuepress/back-to-top', true],
    ['@vuepress/last-updated', true],
    ['@vuepress/pwa', {
      serviceWorker: true,
      updatePopup: true
    }],
  ]
})

function getNav () {
  return [
    navItem('RDF.ex', '/rdf-ex/'),
    navItem('SPARQL.ex', '/sparql-ex/'),
    navItem('ShEx.ex', '/shex-ex/'),
    navItem('Grax', '/grax/'),
    {
      text: 'API Documentation', items: [
        navItem('RDF.ex', 'https://hexdocs.pm/rdf/'),
        navItem('SPARQL.ex', 'https://hexdocs.pm/sparql/'),
        navItem('SPARQL.Client', 'https://hexdocs.pm/sparql_client/'),
        navItem('ShEx.ex', 'https://hexdocs.pm/shex/'),
        navItem('JSON-LD.ex', 'https://hexdocs.pm/json_ld/'),
        navItem('RDF-XML.ex', 'https://hexdocs.pm/rdf_xml/')
      ]
    },
    navItem('Links', '/links')
  ]
}

function navItem (text, link) {
  return {
    text: text,
    link: link
  }
}


function getSidebar () {
  return {
    '/rdf-ex/': getRDFSidebar(),
    '/sparql-ex/': getSPARQLSidebar(),
    '/shex-ex/': getShExSidebar(),
    '/grax/': getGraxSidebar()
  }
}

function getRDFSidebar () {
  return [ 
    {
      title: 'RDF.ex',
      collapsable: false,
      children: [
        '',
        'installation',
        'iris',
        'namespaces',
        'blank-nodes',
        'literals',
        'statements',
        'data-structures',
        'lists',
        'description-and-graph-dsl',
        'mapping-between-rdf-and-elixir',
        'resource-generators',
        'serializations',
        'rdf-star'
      ]    
    }
  ] 
}

function getSPARQLSidebar () {
  return [
    {
      title: 'SPARQL.ex',
      collapsable: false,
      children: [
        '',
        'installation',
        'executing-queries',
        'sparql-client',
        'default-prefixes',
        'defining-extension-functions',
        'sparql-client-configuration',
        'limitations',
      ]
    }
  ]
}

function getShExSidebar () {
  return [
    {
      title: 'ShEx.ex',
      collapsable: false,
      children: [
        '',
        'installation',
        'shape-maps',
        'validation',
        'limitations',
      ]
    }
  ]
}

function getGraxSidebar () {
  return [
    {
      title: 'Grax',
      collapsable: false,
      children: [
        '',
        'installation',
        'schemas',
        'api',
        'ids'
      ]
    }
  ]
}
