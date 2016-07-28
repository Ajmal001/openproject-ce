//-- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
//++

import {opApiModule} from '../../../angular-modules';
import {PathBuilderService} from './path-builder.service';

describe('pathBuilder service', () => {
  var pathBuilder:PathBuilderService;

  beforeEach(angular.mock.module(opApiModule.name));
  beforeEach(angular.mock.inject(function (_pathBuilder_) {
    [pathBuilder] = _.toArray(arguments);
  }));

  it('should exist', () => {
    expect(pathBuilder).to.exist;
  });

  describe('when defining a collection of paths', () => {
    var pathCollection:any;
    var pathConfig:any;
    var path:any;
    var result;
    var withoutParams;
    var withParams;

    const testCallablePath = (prepare) => {
      beforeEach(prepare);

      it('should exist', () => {
        expect(path).to.exist;
      });

      it('should be callable', () => {
        expect(path).to.not.throw(Error);
      });

      describe('when calling it without params', () => {
        beforeEach(() => {
          result = path();
        });

        it('should generate a path without the param', () => {
          expect(result).to.equal(withoutParams);
        });
      });

      describe('when calling it with params', () => {
        beforeEach(() => {
          result = path({param: 'param'});
        });

        it('should generate a path with the param', () => {
          expect(result).to.equal(withParams);
        });
      });
    };

    beforeEach(() => {
      pathConfig = {
        string: 'foo{/param}',
        array: [
          'bar{/param}',
          {
            nestedString: 'nested-string',
            nestedArray: ['nested-array', {}]
          }
        ]
      };
      pathCollection = pathBuilder.buildPaths(pathConfig);
    });

    it('should return the path collection', () => {
      expect(pathCollection).to.exist;
    });

    it('should have the same keys as the config object', () => {
      expect(pathCollection).to.have.all.keys(pathConfig);
    });

    describe('when the path config is a string, the resulting callable', () => {
      testCallablePath(() => {
        path = pathCollection.string;
        withParams = 'foo/param';
        withoutParams = 'foo';
      });
    });

    describe('when the path config is an array, the resulting callable', () => {
      testCallablePath(() => {
        path = pathCollection.array;
        withParams = 'bar/param';
        withoutParams = 'bar';
      });

      it('should have the same properties as the config object', () => {
        expect(path).to.have.all.keys(pathConfig.array[1]);
      });

      describe('when the nested path is a string', () => {
        testCallablePath(() => {
          path = path.nestedString;
          withParams = 'bar/param/nested-string';
          withoutParams = 'bar/nested-string';
        });
      });

      describe('when the nested path is an array', () => {
        testCallablePath(() => {
          path = path.nestedArray;
          withParams = 'bar/param/nested-array';
          withoutParams = 'bar/nested-array';
        });
      });
    });
  });
});
