(function() {

'use strict';
angular.module('rj.list', ['ngSanitize'])

.directive('rjList', function () {
    return {
        scope: {},
        bindToController: {
            data: '=',
            columns: '=',
            actions: '=',
            defaultSortBy: '@',
            onSortBy: '&?',
            onFilterBy: '&?',
            searchDelay: '=?'
        },
        restrict: 'AE',
        controller: 'ListCtrl',
        controllerAs: 'vm',
        template: ' <div> \
                        <div class="panel panel-default"> \
                            <div class="table-responsive panel-body"> \
                                <table class="table table-striped table-bordered table-hover"> \
                                    <thead> \
                                        <tr> \
                                            <th ng-repeat="column in vm.columns" ng-attr-width="{{column.width || undefined}}"> \
                                                <div class="btn-group"> \
                                                    <button class="btn btn-link" ng-click="vm.sortBy(column.name)">{{ vm.getTitle(column) }} \
                                                        <i class="fa fa-caret-down" ng-show="vm.sortBy[0] === column.name && vm.sortBy[1] === \'desc\'"></i> \
                                                        <i class="fa fa-caret-up" ng-show="vm.sortBy[0] === column.name && vm.sortBy[1] === \'asc\'"></i> \
                                                    </button> \
                                                    <div class="pull-right" ng-if="column.filter"> \
                                                        <button class="btn btn-link dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> \
                                                            <i class="fa fa-filter" ng-class="{active : !!vm.filters[column.name]}"></i> \
                                                        </button> \
                                                        <ul class="dropdown-menu" ng-if="column.filter.options"> \
                                                            <li ng-repeat="option in column.filter.options" ng-click="vm.filterBy(column.name, option.value)"> \
                                                                <a href=""> \
                                                                {{ option.name }}<i class="fa fa-check pull-right" ng-show="vm.filters[column.name] === option.value"></i> \
                                                            </a> \
                                                        </ul> \
                                                        <input class="dropdown-menu" ng-if="!column.filter.options" placeholder="Search..." ng-model="filterValue" ng-change="vm.filterBy(column.name, filterValue)"> \
                                                    </div> \
                                                </div> \
                                            </th> \
                                            <th ng-if="vm.actions && vm.actions.length > 0" width="106px"></th> \
                                        </tr> \
                                    </thead> \
                                    <tbody> \
                                        <tr ng-repeat="row in (vm.filteredData = vm.data | filter:vm.filters)"> \
                                            <td ng-repeat="column in vm.columns" ng-bind-html="vm.getValue(row, column)"></td> \
                                            <td ng-if="vm.actions && vm.actions.length"> \
                                                <div class="btn-group"> \
                                                    <button class="btn btn-sm btn-default" ng-click="vm.actions[0].onClick(row)">{{ vm.actions[0].name }}</button> \
                                                    <button type="button" ng-if="vm.actions.length > 1" class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> \
                                                        <span class="caret"></span> \
                                                        <span class="sr-only">Toggle Dropdown</span> \
                                                    </button> \
                                                    <ul ng-if="vm.actions.length > 1" class="dropdown-menu dropdown-menu-right"> \
                                                        <li ng-repeat="action in vm.actions" ng-class="{ divider: !action.name }"> \
                                                            <a href="" ng-if="!!action.name" ng-click="action.onClick(row)">{{ action.name }}</a> \
                                                        </li> \
                                                    </ul> \
                                                </div> \
                                            </td> \
                                        </tr> \
                                    </tbody> \
                                </table> \
                            </div> \
                        </div> \
                        <loader background="#333366" style="margin-top:30px;" ng-hide="!!vm.data"></loader> \
                        <div ng-show="vm.filteredData && !vm.filteredData.length"> \
                            There is no data. \
                        </div> \
                    </div>'
    };
})

.controller('ListCtrl', ['$sce', '$interpolate', '$filter', function ($sce, $interpolate, $filter) {
    var vm = this;

    vm.searchDelay = vm.searchDelay && parseInt(vm.searchDelay, 10) || 300;

    vm.sortBy = (vm.defaultSortBy && vm.defaultSortBy.split(/[\s,]+/)) || [vm.columns[0].name, 'asc'];
    vm.onSortBy = vm.onSortBy || function (args) {
        vm.data.sort(function (a, b) {
            if (a[args.property] === b[args.property]) return 0;
            if ((a[args.property] > b[args.property] && args.direction === 'asc') || (a[args.property] < b[args.property] && args.direction === 'desc')) return 1;
            return -1;
        });
    };
    vm.sortBy = function (field) {
        if (vm.sortBy[0] === field) {
            vm.sortBy[1] = (vm.sortBy[1] === 'asc' ? 'desc' : 'asc');
        } else {
            vm.sortBy[0] = field;
            vm.sortBy[1] = 'asc';
        }
        vm.onSortBy({property: vm.sortBy[0], direction: vm.sortBy[1]});
    }

    vm.filters = { };
    vm.filterBy = function(property, value) {
        if (vm.filters[property] === value) {
            delete vm.filters[property];
        } else {
            vm.filters[property] = value;
        }
        vm.onFilterBy && vm.onFilterBy({filters: vm.filters});
    }

    vm.getTitle = function (column) {
        if (typeof column.title === 'function') {
            return $sce.trustAsHtml($interpolate(column.title(column))(column));
        } else if (column.title !== undefined) {
            return $sce.trustAsHtml($interpolate(column.title)(column));
        } else {
            return $filter('humanCase')(column.name);
        }
    }

    vm.getValue = function (row, column) {
        if (typeof column.value === 'function') {
            return $sce.trustAsHtml($interpolate(column.value(row))(row));
        } else if (column.value !== undefined) {
            return $sce.trustAsHtml($interpolate(column.value)(row));
        } else if (column.displayMap) {
            return column.displayMap[row[column.name]];
        } else {
            return row[column.name];
        }
    };

    // Resolve promises
    vm.columns.forEach(function(column) {
        if (column.filter && column.filter.options && typeof column.filter.options.then === 'function') {
            column.filter.options.then(function(results) {
                column.filter.options = results;
            });
        }
        if (column.displayMap && typeof column.displayMap.then === 'function') {
            column.displayMap.then(function(results) {
                column.displayMap = results;
            });
        }
    });
}]);

})();
