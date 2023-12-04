import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "NikolausDAO",
  description: "3D AI Incentived DAO deliverd to your doorstep.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],

    sidebar: [
      {
        text: 'Documents',
        items: [
          { text: 'Software-Design', link: '/Software-Design' },
          { text: 'Proposal', link: '/proposal' },
          { text: 'Judging-Criteria', link: '/Judging-Criteria' },
          { text: 'Members', link: '/members' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
