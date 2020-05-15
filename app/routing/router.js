/**
    Router configuration
    @name router.js
    @file Specifies the behavior of the router, handles
    redirection of users non authenticated, prevent access
    of non-autorized users to the current project
*/

import VueRouter from 'vue-router';
import { routes as routesMap } from './routes.js';


const routes = Object.keys(routesMap).map((route) => {
    return Object.assign(routesMap[route], { path: route });
});

const router = new VueRouter({
    scrollBehavior() {
        return { x: 0, y: 0 };
    },
    mode: 'hash',
    routes,
});

export default router;
