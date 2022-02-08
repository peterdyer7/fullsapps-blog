// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'FullsApps',
  tagline:
    'Fullstack Applications development, with React (web and mobile/native) front-ends and serverless, cloud based (AWS, Firebase/Google) back-ends',
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
        blog: {
          path: './blog',
          routeBasePath: 'blog',
          blogTitle: 'FullsApps - Fullstack, Applications - blog!',
          blogDescription:
            'Fullstack Applications development, with React (web and mobile/native) front-ends and serverless, cloud based (AWS, Firebase/Google) back-ends',
          showReadingTime: true,
          editUrl: 'https://github.com/peterdyer7/fullsapps-blog/tree/main/',
          feedOptions: {
            type: 'all',
            title: 'FullsApps Feed',
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
            href: '/markdown-page',
            label: 'Profile',
            position: 'left',
          },
          {
            href: '/markdown-page',
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
        links: [],
        copyright: `Copyright © ${new Date().getFullYear()} FullsApps, Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
