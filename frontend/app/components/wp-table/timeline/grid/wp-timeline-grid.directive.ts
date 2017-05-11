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
import {
  TimelineViewParameters,
  timelineElementCssClass,
  ZoomLevel,
  calculatePositionValueForDayCount, timelineGridElementCssClass
} from "../wp-timeline";
import {WorkPackageTimelineTableController} from "../container/wp-timeline-container.directive";
import * as moment from 'moment';
import Moment = moment.Moment;
import {openprojectModule} from "../../../../angular-modules";

export class WorkPackageTableTimelineGrid {

  public wpTimeline:WorkPackageTimelineTableController;

  private activeZoomLevel:ZoomLevel;

  private gridContainer:ng.IAugmentedJQuery;

  constructor(public $element:ng.IAugmentedJQuery) {
  }

  $onInit() {
    this.gridContainer = this.$element.find('.wp-table-timeline--grid');
    this.wpTimeline.onRefreshRequested('grid', (vp:TimelineViewParameters) => this.refreshView(vp));
  }

  refreshView(vp:TimelineViewParameters) {
    this.renderLabels(vp);
  }

  private renderLabels(vp:TimelineViewParameters) {
    if (this.activeZoomLevel === vp.settings.zoomLevel) {
      return;
    }

    this.gridContainer.empty();

    switch (vp.settings.zoomLevel) {
      case ZoomLevel.DAYS:
        return this.renderLabelsDays(vp);
      case ZoomLevel.WEEKS:
        return this.renderLabelsWeeks(vp);
      case ZoomLevel.MONTHS:
        return this.renderLabelsMonths(vp);
      case ZoomLevel.QUARTERS:
        return this.renderLabelsQuarters(vp);
      case ZoomLevel.YEARS:
        return this.renderLabelsYears(vp);
    }

    this.activeZoomLevel = vp.settings.zoomLevel;
  }

  private renderLabelsDays(vp:TimelineViewParameters) {
    this.renderTimeSlices(vp, "day", vp.dateDisplayStart, vp.dateDisplayEnd, (start, cell) => {
      cell.style.paddingTop = "1px";
    });
  }

  private renderLabelsWeeks(vp:TimelineViewParameters) {
    this.renderTimeSlices(vp, "day", vp.dateDisplayStart, vp.dateDisplayEnd, (start, cell) => {
      cell.style.paddingTop = "5px";
    });
  }

  private renderLabelsMonths(vp:TimelineViewParameters) {
    this.renderTimeSlices(vp, "week", vp.dateDisplayStart, vp.dateDisplayEnd, (start, cell) => {
      cell.style.paddingTop = "5px";
    });
  }

  private renderLabelsQuarters(vp:TimelineViewParameters) {
    this.renderTimeSlices(vp, "month", vp.dateDisplayStart, vp.dateDisplayEnd, (start, cell) => {
      cell.style.paddingTop = "5px";
    });
  }

  private renderLabelsYears(vp:TimelineViewParameters) {
    this.renderTimeSlices(vp, "month", vp.dateDisplayStart, vp.dateDisplayEnd, (start, cell) => {
      cell.style.paddingTop = "5px";
    });
  }

  renderTimeSlices(vp:TimelineViewParameters,
                   unit:moment.unitOfTime.DurationConstructor,
                   startView:Moment,
                   endView:Moment,
                   cellCallback:(start:Moment, cell:HTMLElement) => void) {

    const slices:[Moment, Moment][] = [];

    const time = startView.clone().startOf(unit);
    const end = endView.clone().endOf(unit);

    while (time.isBefore(end)) {
      const sliceStart = moment.max(time, startView).clone();
      const sliceEnd = moment.min(time.clone().endOf(unit), endView).clone();
      time.add(1, unit);
      slices.push([sliceStart, sliceEnd]);
    }

    for (let [start, end] of slices) {
      const cell = document.createElement("div");
      cell.classList.add(timelineElementCssClass, timelineGridElementCssClass);
      cell.style.left = calculatePositionValueForDayCount(vp, start.diff(startView, "days"));
      cell.style.width = calculatePositionValueForDayCount(vp, end.diff(start, "days") + 1);
      this.gridContainer[0].appendChild(cell);
      cellCallback(start, cell);
    }
  }
}

openprojectModule.component("wpTimelineGrid", {
  template: '<div class="wp-table-timeline--grid"></div>',
  controller: WorkPackageTableTimelineGrid,
  require: {
    wpTimeline: '^wpTimelineContainer'
  }
});
