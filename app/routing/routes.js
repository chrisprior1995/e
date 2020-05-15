import home from 'views/home.vue';


export const routes = {
    '/home': {
        path: '/home',
        name: 'home',
        description: 'Ranging Tool Home',
        component: home,
    },
    '*': {
        redirect: '/home',
        name: 'default',
    },
};
