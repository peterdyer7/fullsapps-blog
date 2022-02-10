// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'FullsApps',
  tagline: 'Fullstack, cloud native, serverless, application development',
  url: 'https://fullsapps.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'peterdyer7', // Usually your GitHub org/user name.
  projectName: 'fullsapps-blog', // Usually your repo name.

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        pages: {
          remarkPlugins: [require('mdx-mermaid')],
        },
        docs: false,
        blog: {
          path: './blog',
          routeBasePath: '/blog',
          blogTitle: 'FullsApps - Fullstack, Applications - blog!',
          blogDescription: 'Toughts on fullstack, cloud native, serverless, application development',
          showReadingTime: true,
          editUrl: 'https://github.com/peterdyer7/fullsapps-blog/tree/main/',
          feedOptions: {
            type: 'all',
            title: 'FullsApps Feed',
            description: 'Fullstack, cloud native, serverless, application development',
            copyright: `Copyright © ${new Date().getFullYear()} FullsApps`,
            language: 'en',
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'FullsApps',
        items: [
          { to: '/blog', label: 'Blog', position: 'left' },
          {
            position: 'left',
            label: 'Topics',
            items: [
              {
                href: '/aws',
                label: 'AWS',
              },
              {
                href: '/firebase',
                label: 'Firebase & GC',
              },
              {
                href: '/graphql',
                label: 'GraphQL',
              },
              {
                href: '/media-library',
                label: 'Media Library',
              },
            ],
          },
          {
            href: '/profile',
            label: 'Profile',
            position: 'left',
          },
          {
            href: '/projects',
            label: 'Projects',
            position: 'left',
          },
          {
            href: 'https://github.com/peterdyer7/fullsapps-blog',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            label: 'Blog Archive',
            to: '/blog/archive',
          },
          {
            label: 'Blog Tags',
            to: '/blog/tags',
          },
          {
            label: 'RSS',
            href: 'https://fullsapps.com/blog/rss.xml',
          },
          {
            label: 'Atom',
            href: 'https://fullsapps.com/blog/atom.xml',
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} FullsApps, Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
