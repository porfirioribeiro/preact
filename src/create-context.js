import { enqueueRender } from './component';

export let i = 0;

export function createContext(defaultValue) {
	const ctx = {};

	function Provider(props) {
		this.subs = [];
		this.props = props;
	}

	Provider.prototype.sub = function(c) {
		this.subs.push(c);
		let old = c.componentWillUnmount;
		c.componentWillUnmount = () => {
			this.subs.splice(this.subs.indexOf(c), 1);
			old && old.call(c);
		};
	};

	Provider.prototype.getChildContext = function() {
		ctx[context._id] = this;
		return ctx;
	};

	Provider.prototype.$render = function(props) {
		if (this.props.value !== props.value) {
			this.props = props;
			this.subs.some(c => {
				c.context = props.value;
				enqueueRender(c);
			});
		}

		return props.children;
	};

	const context = {
		_id: '__cC' + i++,
		_defaultValue: defaultValue,
		Consumer(props, context) {
			return props.children(context);
		},
		Provider
	};

	context.Consumer.contextType = context;

	return context;
}
