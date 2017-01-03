(function (angular) {
    'use strict';

    angular.module('nav.config', []).constant('navConfig', {
        //server-specific settings go here
       'ActiveFilterNodeNum': '28219',
       'DefaultFilterNodeNum': '28219'
         // 'ActiveFilterNodeNum': '28184', //For Node Local HTTP-Server
         // 'DefaultFilterNodeNum': '28184' //For Node Local HTTP-Server
        //'FilterNodeNum': '28184' //Live Site ID
    });

})(angular);
