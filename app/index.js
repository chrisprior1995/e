/**
    Index file.
    @file Instanciates the app, initialise the router and interceptor
*/
import Vue from './vue';

import index from './vue/index.vue';
// import { store } from './store.js';

// import router from './routing/router.js';
// import './interceptors/interceptors';

// Init
new Vue({
    // router,
    // store,
    render: h => {
        return h(index);
    },
}).$mount('#app-container');
