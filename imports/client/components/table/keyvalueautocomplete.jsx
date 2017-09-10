import Handsontable from 'handsontable';
import _ from 'lodash';

/* Key/value autocomplete editor.

Use a cell like this:

{
    title: "User",
    data: "user",
    ...KeyValueAutocompleteCell,

    // the autocomplete dropdown is a handsontable-in-handsontable; configure
    // it here.
    handsontable: {
        // should correspond to the data fetched in `source()`
        dataSchema: {name: null, email: null},
        columns: [
            {title: "Name", width: 150, data: 'name'},
            {title: "Email", width: 200, data: 'email'}
        ],
        // return the value to be saved in the table when a selection is made
        getValue() {
            const selection = this.getSelected();
            return this.getSourceDataAtRow(selection[0])._id;
        }
    },

    // this function will be called to match the title set in the text field
    extractTitle: row => row? row.name : "",

    strict: true,
    filteringCaseSensitive: false,

    source: (query, process) => {

        // fetch data here, then call process with a list of values. Each
        // value should be an object at least the same fields as the columns
        // of the inner handsontable.

        // here's some test data...
        setTimeout(() => {
            process([
                {_id: 'a', name: "User Alpha", email: "alpha@example.org"},
                {_id: 'b', name: "User Beta", email: "beta@example.org"},
                {_id: 'd', name: "User Delta", email: "delta@example.org"},
            ])
        }, 100);
    }
}

In the main handsontable, you can preload the data for the selected item so that
the cell renders the right thing as returned by `extractTitle`. To do that,
the `data` of the handsontable instance has to contain objects like this:

    {
        // other props
        user: 'a', // the id, i.e. the thing returned by `getValue()` above
        __autocomplete__: {
            user: {_id: 'a', name: "User Alpha", email: "alpha@example.org"}
        }
    }

When the user selects a value using the editor, the `__autocomplete__` key will
be created in the relevant record in the table's source `data`. This may
surprise you later, and you will likely need to filter it out later if you use
the data correctly.
*/

const AutocompleteEditor = Handsontable.editors.AutocompleteEditor,
      HandsontableEditor = Handsontable.editors.HandsontableEditor,
      AutocompleteRenderer = Handsontable.renderers.AutocompleteRenderer;

export const KeyValueAutocompleteEditor = AutocompleteEditor.prototype.extend();

_.extend(KeyValueAutocompleteEditor.prototype, {

    metadataProp: '__autocomplete__',

    getMetadata() {
        let md = this.instance.getSourceDataAtRow(this.row)[this.metadataProp];
        return md? md[this.prop] : undefined;
    },

    setMetadata(value) {
        let rowData = this.instance.getSourceDataAtRow(this.row),
            md = rowData[this.metadataProp];
        if(!md) {
            md = rowData[this.metadataProp] = {};
        }
        md[this.prop] = value;
    },

    open() {
        AutocompleteEditor.prototype.open.apply(this, arguments);

        // we don't want this hook to run, it stringifes everything
        // also: no good API for this if we don't have a refernece to the the
        // original hook :(

        const bucket = Handsontable.hooks.getBucket(this.htEditor),
              bucketList = bucket.afterRenderer; // see what I did there?

        bucketList.forEach(cb => {
            this.htEditor.removeHook('afterRenderer', cb);
        });
    },

    prepare() {
        AutocompleteEditor.prototype.prepare.apply(this, arguments);

        // We don't support stripping tags (allowHtml), trimming list (filter),
        // sorting by relevance (make the source function sort), or trimming
        // the dropdown... yet.
        this.cellProperties.filter = false;
        this.cellProperties.allowHtml = true;
        this.cellProperties.sortByRelevance = false;
    },

    beginEditing(initialValue) {
        // Set initial editor value based on the title that was last used
        let hint = this.getMetadata();

        if(hint !== undefined && this.cellProperties.extractTitle !== undefined) {
            initialValue = this.cellProperties.extractTitle(hint);
        }

        HandsontableEditor.prototype.beginEditing.apply(this, [initialValue]);
    },

    stripValuesIfNeeded(values) {
        // Base editor stringifies values unhelpfully
        return values;
    },

    updateChoicesList(choices) {
        this.choices = choices;
        this.htEditor.loadData(choices);
        this.updateDropdownHeight();
        this.flipDropdownIfNeeded();
        this.highlightBestMatchingChoice(this.findBestMatchingChoice());
        this.focus();
    },

    highlightBestMatchingChoice(index) {
        if (typeof index === 'number') {
            let endCol = this.htEditor.countCols() - 1;
            this.htEditor.selectCell(index, 0, index, endCol);
        } else {
            this.htEditor.deselectCell();
        }
    },

    findBestMatchingChoice() {
        let bestMatch = {},
            choices = this.choices,
            value = this.getValue(),
            valueLength = value.length,
            filteringCaseSensitive = this.cellProperties.filteringCaseSensitive,
            currentItem,
            indexOfValue,
            charsLeft;

        if(!filteringCaseSensitive) {
            value = value.toLowerCase();
        }

        for(let i = 0, len = choices.length; i < len; i++){
            currentItem = this.cellProperties.extractTitle(choices[i]);

            if(currentItem && !filteringCaseSensitive) {
                currentItem = currentItem.toLowerCase();
            }

            if(valueLength > 0){
                indexOfValue = currentItem.indexOf(value);
            } else {
                indexOfValue = currentItem === value ? 0 : -1;
            }

            if(indexOfValue == -1) continue;

            charsLeft =  currentItem.length - indexOfValue - valueLength;

            if(
                typeof bestMatch.indexOfValue == 'undefined' ||
                bestMatch.indexOfValue > indexOfValue ||
                (bestMatch.indexOfValue == indexOfValue && bestMatch.charsLeft > charsLeft)
            ){
                bestMatch.indexOfValue = indexOfValue;
                bestMatch.charsLeft = charsLeft;
                bestMatch.index = i;
            }

        }

        return bestMatch.index;
    },

    finishEditing(restoreOriginalValue) {
        if(this.htEditor) {
            let selection = this.htEditor.getSelected();

            if(selection) {
                let rowData = this.htEditor.getSourceDataAtRow(selection[0]),
                    value = this.htEditor.getValue();

                if(rowData !== undefined && value !== undefined) {
                    this.setMetadata(rowData);
                }
            }
        }

        AutocompleteEditor.prototype.finishEditing.apply(this, arguments);
    },

    getDropdownHeight() {
        // TODO: We should find a better calculation here
        return undefined;
    }
});

const KeyValueAutocompleteCell = {
    editor: KeyValueAutocompleteEditor,
    renderer: (instance, td, row, col, prop, value, cellProperties) => {
        if(value !== undefined && value !== null) {
            let md = instance.getSourceDataAtRow(row)[KeyValueAutocompleteEditor.prototype.metadataProp];
            if(md) {
                let hint = md[prop];
                if(hint !== undefined) {
                    value = cellProperties.extractTitle(hint);
                }
            }
        }

        AutocompleteRenderer(instance, td, row, col, prop, value, cellProperties);
    }
};

export default KeyValueAutocompleteCell;
