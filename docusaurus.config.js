const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

// With JSDoc @type annotations, IDEs can provide config autocompletion
/** @type {import('@docusaurus/types').DocusaurusConfig} */
(
  module.exports = {
    title: 'My Site',
    tagline: 'Dinosaurs are cool',
    url: 'https://your-docusaurus-test-site.com',
    baseUrl: '/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',
    organizationName: 'facebook', // Usually your GitHub org/user name.
    projectName: 'docusaurus', // Usually your repo name.

    presets: [
      [
        '@docusaurus/preset-classic',
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
              'Thoughts and examples for building modern applications with React (web and mobile/native) front-ends and Serverless, Cloud (AWS, Firebase/Google) based back-ends.',
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
          logo: {
            alt: 'My Site Logo',
            src: 'img/logo.svg',
          },
          items: [
            { to: '/blog', label: 'Blog', position: 'left' },
            {
              position: 'left',
              label: 'Topics',
              items: [
                {
                  href: '/helloMarkdown',
                  label: 'Hello MD',
                },
                {
                  href: '/helloReact',
                  label: 'Hello React',
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
          additionalLanguages: ['bash'],
        },
      }),
  }
);
