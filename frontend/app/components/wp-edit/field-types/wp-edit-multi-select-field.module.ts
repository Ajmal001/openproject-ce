// -- copyright
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
// ++

import {EditField} from '../wp-edit-field/wp-edit-field.module';
import {CollectionResource} from 'core-app/modules/hal/resources/collection-resource';
import {HalResource} from 'core-app/modules/hal/resources/hal-resource';
import {I18nToken} from 'core-app/angular4-transition-utils';
import {ValueOption} from 'core-components/wp-edit/field-types/wp-edit-select-field.module';

export class MultiSelectEditField extends EditField {
  public options:any[];
  public valueOptions:ValueOption[];
  public template:string = '/components/wp-edit/field-types/wp-edit-multi-select-field.directive.html';
  public text:{ requiredPlaceholder:string, placeholder:string, save:string, cancel:string };
  public isMultiselect:boolean;

  // Dependencies
  readonly I18n:op.I18n = this.$injector.get(I18nToken);

  public currentValueInvalid:boolean = false;
  private nullOption:ValueOption;
  private _selectedOption:ValueOption|ValueOption[];

  protected initialize() {
    this.isMultiselect = this.isValueMulti();

    this.text = {
      requiredPlaceholder: this.I18n.t('js.placeholders.selection'),
      placeholder: this.I18n.t('js.placeholders.default'),
      save: this.I18n.t('js.inplace.button_save', { attribute: this.schema.name }),
      cancel: this.I18n.t('js.inplace.button_cancel', { attribute: this.schema.name })
    };

    this.nullOption = { name: this.text.placeholder, href: null };

    if (angular.isArray(this.schema.allowedValues)) {
      this.setValues(this.schema.allowedValues);
    } else if (this.schema.allowedValues) {
      this.schema.allowedValues.$load().then((values:CollectionResource) => {
        // The select options of the project shall be sorted
        if (values.count > 0 && (values.elements[0] as any)._type === 'Project') {
          this.setValues(values.elements, true);
        } else {
          this.setValues(values.elements);
        }
      });
    } else {
      this.setValues([]);
    }
  }

  public get value() {
    const val = this.changeset.value(this.name);

    if (!Array.isArray(val) || this.isMultiselect) {
      return val;
    } else {
      return val[0];
    }
  }

  /**
   * Map the selected hal resource(s) to the value options so that ngOptions will track them.
   * We cannot pass the HalResources themselves as angular will copy them on every digest due to trackBy
   * @returns {any}
   */
  public buildSelectedOption() {
    const value:HalResource|HalResource[] = this.changeset.value(this.name);

    if (this.isMultiselect) {
      if (!Array.isArray(value)) {
        return [this.findValueOption(value)];
      }

      return value.map(val => this.findValueOption(val));
    }

    if (!Array.isArray(value)) {
      return this.findValueOption(value);
    } else if (value.length > 0) {
      return this.findValueOption(value[0]);
    }

    return this.nullOption;
  }

  public get selectedOption() {
    return this._selectedOption;
  }

  /**
   * Map the ValueOption to the actual HalResource option
   * @param val
   */
  public set selectedOption(val:ValueOption|ValueOption[]) {
    this._selectedOption = val;
    let selected:any;
    let mapper = (val:ValueOption) => {
      let option = _.find(this.options, o => o.href === val.href) || this.nullOption;

      // Special case 'null' value, which angular
      // only understands in ng-options as an empty string.
      if (option && option.href === '') {
        option.href = null;
      }

      return option;
    };

    const value = _.castArray(val).map(el => mapper(el));
    this.changeset.setValue(this.name, value);
  }

  public isValueMulti() {
    const val = this.changeset.value(this.name);
    return val && val.length > 1;
  }

  public toggleMultiselect() {
    this.isMultiselect = !this.isMultiselect;
    this._selectedOption = this.buildSelectedOption();
  }

  private findValueOption(option?:HalResource):ValueOption {
    let result;

    if (option) {
      result = _.find(this.valueOptions, (valueOption) => valueOption.href === option.href)!;
    }

    return result || this.nullOption;
  }

  private setValues(availableValues:any[], sortValuesByName:boolean = false) {
    if (sortValuesByName) {
      availableValues.sort(function (a:any, b:any) {
        var nameA = a.name.toLowerCase();
        var nameB = b.name.toLowerCase();
        return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
      });
    }

    this.options = availableValues;
    this.addEmptyOption();
    this.valueOptions = this.options.map(el => {
      return { name: el.name, href: el.href };
    });
    this._selectedOption = this.buildSelectedOption();
    this.checkCurrentValueValidity();
  }

  private checkCurrentValueValidity() {
    if (this.value) {
      this.currentValueInvalid = !!(
        // (If value AND)
        // MultiSelect AND there is no value which href is not in the options hrefs OR
        // SingleSelect AND the given values href is not within the options hrefs
        (this.isMultiselect && !_.some(this.value, (value:HalResource) => {
          return _.some(this.options, (option) => (option.href === value.href))
        })) ||
        (!this.isMultiselect && !_.some(this.options,
          (option) => (option.href === this.value.href)))
      );
    }
    else {
      // If no value but required
      this.currentValueInvalid = !!this.schema.required;
    }
  }

  private addEmptyOption() {
    // Empty options are not available for required fields
    if (this.schema.required) {
      return;
    }

    // Since we use the original schema values, avoid adding
    // the option if one is returned / exists already.
    const emptyOption = _.find(this.options, { name: this.text.placeholder });
    if (emptyOption === undefined) {
      this.options.unshift(this.nullOption);
    }
  }
}
