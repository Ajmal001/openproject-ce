require 'spec_helper'

describe 'Work Package table hierarchy', js: true do
  let(:user) { FactoryGirl.create :admin }
  let(:project) { FactoryGirl.create(:project) }

  let(:wp_table) { Pages::WorkPackagesTable.new(project) }
  let(:hierarchy) { ::Components::WorkPackages::Hierarchies.new }

  def expect_listed(*wps)
    wps.each do |wp|
      wp_table.expect_work_package_listed(wp)
    end
  end

  def expect_hidden(*wps)
    wps.each do |wp|
      hierarchy.expect_hidden(wp)
    end
  end

  before do
    login_as(user)
  end

  describe 'hierarchies in same project' do
    let(:category) { FactoryGirl.create :category, project: project, name: 'Foo' }

    let!(:wp_root) { FactoryGirl.create(:work_package, project: project) }
    let!(:wp_inter) { FactoryGirl.create(:work_package, project: project, parent: wp_root) }
    let!(:wp_leaf) { FactoryGirl.create(:work_package, project: project, category: category, parent: wp_inter) }
    let!(:wp_other) { FactoryGirl.create(:work_package, project: project) }

    let!(:query) do
      query              = FactoryGirl.build(:query, user: user, project: project)
      query.column_names = ['subject', 'category']
      query.filters.clear
      query.add_filter('category_id', '=', [category.id])
      query.show_hierarchies = true

      query.save!
      query
    end

    it 'shows hierarchy correctly' do
      wp_table.visit!
      expect_listed(wp_root, wp_inter, wp_leaf, wp_other)

      # Hierarchy mode is enabled by default
      hierarchy.expect_hierarchy_at(wp_root)
      hierarchy.expect_hierarchy_at(wp_inter)
      hierarchy.expect_leaf_at(wp_leaf)
      hierarchy.expect_leaf_at(wp_other)

      # Toggling hierarchies hides the inner children
      hierarchy.toggle_row(wp_root)

      # Root, other showing
      expect_listed(wp_root, wp_other)
      # Inter, Leaf hidden
      expect_hidden(wp_inter, wp_leaf)

      # Show all again
      hierarchy.toggle_row(wp_root)
      expect_listed(wp_root, wp_other, wp_inter, wp_leaf)

      # Disable hierarchies
      hierarchy.disable_hierarchy
      hierarchy.expect_no_hierarchies

      # Editing is possible while retaining hierachy
      hierarchy.enable_hierarchy
      subject = wp_table.edit_field wp_inter, :subject
      subject.update 'New subject'

      wp_table.expect_notification message: 'Successful update.'
      wp_table.dismiss_notification!

      hierarchy.expect_hierarchy_at(wp_root)
      hierarchy.expect_hierarchy_at(wp_inter)
      hierarchy.expect_leaf_at(wp_leaf)
      hierarchy.expect_leaf_at(wp_other)

      # Disable hierarchy again
      hierarchy.disable_hierarchy
      hierarchy.expect_no_hierarchies

      # Now visiting the query for category
      wp_table.visit_query(query)

      # Should only list the matching leaf
      wp_table.expect_work_package_listed(wp_leaf)

      hierarchy.expect_hierarchy_at(wp_root)
      hierarchy.expect_hierarchy_at(wp_inter)

      hierarchy.toggle_row(wp_root)
      expect_listed(wp_root)
      expect_listed(wp_inter, wp_leaf)

      # Disabling hierarchy hides them again
      hierarchy.disable_hierarchy

      expect(page).to have_no_selector("#wp-row-#{wp_root.id}")
      expect(page).to have_no_selector("#wp-row-#{wp_inter.id}")
    end
  end

  describe 'with a cross project hierarchy' do
    let(:project2) { FactoryGirl.create(:project) }
    let!(:wp_root) { FactoryGirl.create(:work_package, project: project) }
    let!(:wp_inter) { FactoryGirl.create(:work_package, project: project2, parent: wp_root) }
    let(:global_table) { Pages::WorkPackagesTable.new }
    it 'shows the hierarchy indicator only when the rows are both shown' do
      wp_table.visit!
      expect_listed(wp_root)
      wp_table.expect_work_package_not_listed(wp_inter)
      hierarchy.expect_leaf_at(wp_root)

      # Visit global table
      global_table.visit!
      expect_listed(wp_root, wp_inter)
      hierarchy.expect_hierarchy_at(wp_root)
      hierarchy.expect_leaf_at(wp_inter)
    end
  end

  describe 'sorting so that the parent appears below the child' do
    let!(:wp_root) { FactoryGirl.create(:work_package, project: project, assigned_to: user) }
    let!(:wp_inter) { FactoryGirl.create(:work_package, project: project, parent: wp_root) }

    let!(:query) do
      query              = FactoryGirl.build(:query, user: user, project: project)
      query.column_names = ['subject', 'category']
      query.filters.clear
      query.show_hierarchies = false

      query.save!
      query
    end

    it 'removes the parent from the flow, moving it above' do
      # Hierarchy disabled, expect wp_inter before wp_root
      wp_table.visit_query query
      wp_table.expect_work_package_listed(wp_inter)
      wp_table.expect_work_package_listed(wp_root)
      wp_table.expect_work_package_order(wp_inter.id, wp_root.id)

      hierarchy.expect_no_hierarchies

      # Enable hierarchy mode, should move it above now
      hierarchy.enable_hierarchy

      hierarchy.expect_hierarchy_at(wp_root)
      hierarchy.expect_leaf_at(wp_inter)

      wp_table.expect_work_package_listed(wp_inter)
      wp_table.expect_work_package_listed(wp_root)
      wp_table.expect_work_package_order(wp_root.id, wp_inter.id)

      # Toggling hierarchies hides the inner children
      hierarchy.toggle_row(wp_root)

      # Root showing
      expect_listed(wp_root)
      # Inter hidden
      expect_hidden(wp_inter)
    end
  end
end
