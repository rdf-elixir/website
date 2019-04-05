module.exports = ctx => ({
  title: 'RDF on Elixir',
  description: 'Implementation of the Linked Data and Semantic Standards for Elixir',
  themeConfig: {
    repo: 'marcelotto/rdf-elixir-website',
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

