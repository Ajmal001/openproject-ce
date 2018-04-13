import {
  ApplicationRef,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  Inject,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {I18nToken, OpModalLocalsToken} from 'core-app/angular4-transition-utils';
import {OpModalLocalsMap} from 'core-components/op-modals/op-modal.types';
import {ConfigurationService} from 'core-components/common/config/configuration.service';
import {WorkPackageTableColumnsService} from 'core-components/wp-fast-table/state/wp-table-columns.service';
import {OpModalComponent} from 'core-components/op-modals/op-modal.component';
import {WpTableConfigurationService} from 'core-components/wp-table/configuration-modal/wp-table-configuration.service';
import {
  ActiveTabInterface,
  TabComponent,
  TabPortalOutlet
} from 'core-components/wp-table/configuration-modal/tab-portal-outlet';

@Component({
  template: require('!!raw-loader!./wp-table-configuration.modal.html')
})
export class WpTableConfigurationModalComponent extends OpModalComponent implements OnInit, OnDestroy  {

  /* Close on escape? */
  public closeOnEscape = false;

  /* Close on outside click */
  public closeOnOutsideClick = false;

  public $element:JQuery;

  public text = {
    title: this.I18n.t('js.work_packages.table_configuration.modal_title'),
    closePopup: this.I18n.t('js.close_popup_title'),

    columnsLabel: this.I18n.t('js.label_columns'),
    selectedColumns: this.I18n.t('js.description_selected_columns'),
    multiSelectLabel: this.I18n.t('js.work_packages.label_column_multiselect'),
    applyButton: this.I18n.t('js.modals.button_apply'),
    cancelButton: this.I18n.t('js.modals.button_cancel'),

    upsaleRelationColumns: this.I18n.t('js.modals.upsale_relation_columns'),
    upsaleRelationColumnsLink: this.I18n.t('js.modals.upsale_relation_columns_link')
  };

  public impaired = this.ConfigurationService.accessibilityModeEnabled();
  public selectedColumnMap:{ [id:string]:boolean } = {};

  // Get the view child we'll use as the portal host
  @ViewChild('tabContentOutlet') tabContentOutlet:ElementRef;
  // And a reference to the actual portal host interface
  private tabPortalHost:TabPortalOutlet;

  constructor(@Inject(OpModalLocalsToken) public locals:OpModalLocalsMap,
              @Inject(I18nToken) readonly I18n:op.I18n,
              readonly wpTableConfigurationService:WpTableConfigurationService,
              readonly injector:Injector,
              readonly appRef:ApplicationRef,
              readonly componentFactoryResolver:ComponentFactoryResolver,
              readonly wpTableColumns:WorkPackageTableColumnsService,
              readonly ConfigurationService:ConfigurationService,
              readonly elementRef:ElementRef) {
    super(locals, elementRef);
  }

  ngOnInit() {
    this.$element = jQuery(this.elementRef.nativeElement);

    this.tabPortalHost = new TabPortalOutlet(
      this.wpTableConfigurationService.tabs,
      this.tabContentOutlet.nativeElement,
      this.componentFactoryResolver,
      this.appRef,
      this.injector
    );

    // Switch to the default tab
    // after a timeout to let the host initialize.
    setTimeout(() => {
      const initialTab = this.locals['initialTab'] || this.availableTabs[0].name;
      this.switchTo(initialTab);
    });
  }

  ngOnDestroy() {
    this.tabPortalHost.dispose();
  }

  public get availableTabs() {
    return this.tabPortalHost.availableTabs;
  }

  public get currentTab():ActiveTabInterface|null {
    return this.tabPortalHost.currentTab;
  }

  public switchTo(name:string) {
    this.tabPortalHost.switchTo(name);
  }

  public saveChanges():void {
    this.tabPortalHost.activeComponents.forEach((component:TabComponent) => {
      component.onSave();
    });

    this.closeMe();
  }

  /**
   * Called when the user attempts to close the modal window.
   * The service will close this modal if this method returns true
   * @returns {boolean}
   */
  public onClose():boolean {
    this.afterFocusOn.focus();
    return true;
  }

  public onOpen(modalElement:JQuery) {
    modalElement
      .find('.wp-table--configuration-modal')
      .focus();
  }

  protected get afterFocusOn():JQuery {
    return this.$element;
  }
}
