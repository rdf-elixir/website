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
    repo: 'marcelotto/rdf-elixir-website',
    docsDir: 'content',
    editLinks: true,
    nav: getNav(),
    sidebar: getSidebar()
  },
  plugins: [
    ['@vuepress/back-to-top', true],
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
    navItem('SPARQL.Client', '/sparql-client/'),
    {
      text: 'API Documentation', items: [
        navItem('RDF.ex', 'https://hexdocs.pm/rdf/'),
        navItem('SPARQL.ex', 'https://hexdocs.pm/sparql/'),
        navItem('SPARQL.Client', 'https://hexdocs.pm/sparql_client/'),
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
    '/sparql-client/': getSPARQLClientSidebar()
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
        'vocabularies',
        'blank-nodes',
        'literals',
        'statements',
        'data-structures',
        'lists',
        'mapping-between-rdf-and-elixir',
        'serializations',
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
        'feature-limitations',
        'installation',
        'executing-queries',
        'defining-extension-functions',
      ]
    }
  ]
}

function getSPARQLClientSidebar () {
  return [
    {
      title: 'SPARQL.Client',
      collapsable: true,
      children: [
        '',
        'installation',
        'examples',
        'configuration',
      ]
    }
  ]
}

