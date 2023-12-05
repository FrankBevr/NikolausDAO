import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "NikolausDAO",
  description: "3D AI Incentived DAO deliverd to your doorstep.",
  themeConfig: {
    logo: "https://camo.githubusercontent.com/112d615f8c8a38d128d5cc79c5187795d99a7d088ecc7bef01465950fd4aeb11/68747470733a2f2f692e6962622e636f2f623271383158422f35636364386162312d656333642d346238342d623030392d3961353734313866376138642e6a7067",
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],

    sidebar: [
      {
        text: 'Documents',
        items: [
          { text: 'Our Journey', link: '/Journey' },
          { text: 'Software-Design', link: '/Software-Design' },
          { text: 'Proposal', link: '/proposal' },
          { text: 'Judging-Criteria', link: '/Judging-Criteria' },
          { text: 'Members', link: '/members' },
          { text: 'Gift List', link: '/GiftList-Rococo' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
