import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Settings2, Calculator, Copy, Link, Github } from 'lucide-react';

const API_TYPES = {
    SEPARATION: 'SEPARATION',
    SOLUTION: 'SOLUTION',
    COMPARISON: 'COMPARISON'
};

const METHOD_RESPONSE_TYPES = {
    task1: API_TYPES.SEPARATION,
    task2: API_TYPES.SOLUTION,
    task3: API_TYPES.SOLUTION,
    task4: API_TYPES.SOLUTION,
    task5: API_TYPES.COMPARISON
};

const PRESET_EQUATIONS = [
    { id: 1, equation: "(0.2x)^3=cos(x)" },
    { id: 2, equation: "x-10sin(x)=0" },
    { id: 3, equation: "2^x=sin(x)", note: "При x < 10" },
    { id: 4, equation: "2x-2cos(x)=0", note: "При x > -10" },
    { id: 5, equation: "ln(x+5)=cos(x)", note: "При x < 5" },
    { id: 6, equation: "√(4x+7)=3cos(x)", note: "(√)Не распознает временно" },
    { id: 7, equation: "x*sin(x)-1=0" },
    { id: 8, equation: "8cos(x)-x=6" },
    { id: 9, equation: "sin(x)-0.2x=0" },
    { id: 10, equation: "10cos(x)-0.1x=0" },
    { id: 11, equation: "21g(x+7)-5sin(x)=0" },
    { id: 12, equation: "4cos(x)+0.3x=0" },
    { id: 13, equation: "5sin(2x)=√(1-x)" },
    { id: 14, equation: "1.2x^4+2x^2-24.1=13x^2+14.2x" },
    { id: 15, equation: "2x^2-5=2x" },
    { id: 16, equation: "2^x=10-0.5x^2" },
    { id: 17, equation: "4x^4-6.2=cos(0.6x)" },
    { id: 18, equation: "3sin(8x)=0.7x-0.9", note: "На отрезке [-1,1]" },
    { id: 19, equation: "1.2-ln(x)=4sin(2x)" },
    { id: 20, equation: "ln(x+6.1)=2sin(x-1.4)" }
];

const METHODS = [
    { id: 1, name: "Отделение корней", endpoint: "task1" },
    { id: 2, name: "Метод половинного деления", endpoint: "task2" },
    { id: 3, name: "Метод простой итерации", endpoint: "task3" },
    { id: 4, name: "Комбинированный метод", endpoint: "task4" },
    { id: 5, name: "Сравнение всех методов", endpoint: "task5" }
];

const NumberInput = ({ value, onChange, onBlur, ...props }) => {
    const [localValue, setLocalValue] = useState(value.toString());

    const handleChange = (e) => {
        setLocalValue(e.target.value);
        if (e.target.value === '-') return;
        const num = parseFloat(e.target.value);
        if (!isNaN(num)) {
            onChange(num);
        }
    };

    const handleBlur = () => {
        const num = parseFloat(localValue);
        if (!isNaN(num)) {
            onChange(num);
            setLocalValue(num.toString());
        } else {
            setLocalValue(value.toString());
        }
        onBlur?.();
    };

    return (
        <input
            type="text"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            {...props}
        />
    );
};

export default function EquationSolver() {
    const [equation, setEquation] = useState("sin(x)");
    const [method, setMethod] = useState(METHODS[0]);
    const [start, setStart] = useState(-10);
    const [end, setEnd] = useState(10);
    const [step, setStep] = useState(0.1);
    const [tolerance, setTolerance] = useState(0.0001);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPresets, setShowPresets] = useState(false);
    const [apiUrl, setApiUrl] = useState('');

    const generateApiUrl = () => {
        let url = `http://localhost:9090/api/equation/${method.endpoint}?equation=${encodeURIComponent(equation)}`;

        switch (method.endpoint) {
            case 'task1':
                url += `&start=${start}&end=${end}&step=${step}`;
                break;
            case 'task2':
            case 'task4':
            case 'task5':
                url += `&a=${start}&b=${end}&tolerance=${tolerance}`;
                break;
            case 'task3':
                url += `&initialGuess=${start}&tolerance=${tolerance}`;
                break;
        }
        return url;
    };

    const handleGenerateApi = () => {
        setApiUrl(generateApiUrl());
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const fetchData = async () => {
        const url = generateApiUrl();
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Origin': 'http://iney.lol:3000'
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || errorText;
                } catch {
                    errorMessage = errorText;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (err) {
            return {
                success: false,
                error: err.message || 'Произошла ошибка при выполнении запроса'
            };
        }
    };

    const handleSolve = async () => {
        setLoading(true);
        setError(null);
        setResults(null);
        setApiUrl('');

        const result = await fetchData();

        if (result.success) {
            setResults(result.data);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const renderSeparationResults = (data) => {
        if (!data || !Array.isArray(data.xpoints)) return null;

        const chartData = data.xpoints.map((x, i) => ({
            x,
            y: data.ypoints[i]
        }));

        return (
            <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">График функции</h2>
                    <div className="h-96 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="x"
                                    tickFormatter={(value) => value.toFixed(2)}
                                />
                                <YAxis
                                    tickFormatter={(value) => value.toFixed(2)}
                                />
                                <Tooltip
                                    formatter={(value) => value.toFixed(4)}
                                    labelFormatter={(value) => `x: ${parseFloat(value).toFixed(4)}`}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="y"
                                    stroke="#3b82f6"
                                    dot={false}
                                    name="f(x)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {data.intervals?.length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Найденные интервалы с корнями</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {data.intervals.map((interval, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-lg shadow">
                                    <p className="font-medium">Интервал {idx + 1}:</p>
                                    <p>[{interval[0].toFixed(4)}, {interval[1].toFixed(4)}]</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSolutionResult = (result) => {
        if (!result?.root) return null;

        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Результат решения</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium">Корень:</p>
                        <p>{parseFloat(result.root).toFixed(6)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium">Итераций:</p>
                        <p>{result.iterations}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium">Точность:</p>
                        <p>{result.accuracy}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium">Время:</p>
                        <p>{result.executionTime} мс</p>
                    </div>
                    {result.method && (
                        <div className="col-span-2 p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium">Метод:</p>
                            <p>{result.method}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderComparisonResults = (data) => {
        if (!Array.isArray(data)) return null;

        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Сравнение методов</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.map((result, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg shadow">
                            <h3 className="font-medium mb-2">{result.method}</h3>
                            {result.root ? (
                                <div className="space-y-2">
                                    <p><span className="font-medium">Корень:</span> {parseFloat(result.root).toFixed(6)}</p>
                                    <p><span className="font-medium">Итераций:</span> {result.iterations}</p>
                                    <p><span className="font-medium">Точность:</span> {result.accuracy}</p>
                                    <p><span className="font-medium">Время:</span> {result.executionTime} мс</p>
                                </div>
                            ) : (
                                <p className="text-red-500">Метод не смог найти решение</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 max-w-6xl space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Calculator className="w-8 h-8"/>
                        <h1 className="text-2xl font-bold">Решение уравнений</h1>
                    </div>
                    <a
                        href="https://github.com/ineydlis"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <Github className="w-5 h-5"/>
                        <span className="text-sm">Разработал: Мельников Егор 1521-2</span>
                    </a>
                </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Уравнение</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={equation}
                                        onChange={(e) => setEquation(e.target.value)}
                                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowPresets(!showPresets)}
                                            className="h-full px-4 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-2 transition-colors"
                                        >
                                            <Settings2 className="w-4 h-4"/>
                                        </button>
                                        {showPresets && (
                                            <div
                                                className="absolute z-10 right-0 mt-2 w-96 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                                                {PRESET_EQUATIONS.map((preset) => (
                                                    <button
                                                        key={preset.id}
                                                        onClick={() => {
                                                            setEquation(preset.equation);
                                                            setShowPresets(false);
                                                        }}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex justify-between items-center"
                                                    >
                                                        <span>{preset.id}. {preset.equation}</span>
                                                        {preset.note && (
                                                            <span className="text-sm text-gray-500">{preset.note}</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Метод решения</label>
                                <select
                                    value={method.id}
                                    onChange={(e) => setMethod(METHODS.find(m => m.id === parseInt(e.target.value)))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                >
                                    {METHODS.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {method.endpoint === 'task3' ? 'Начальное приближение' : 'Начало интервала'}
                                    </label>
                                    <NumberInput
                                        value={start}
                                        onChange={setStart}
                                        placeholder="Введите число"
                                    />
                                </div>
                                {method.endpoint !== 'task3' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Конец интервала</label>
                                        <NumberInput
                                            value={end}
                                            onChange={setEnd}
                                            placeholder="Введите число"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {method.endpoint === 'task1' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Шаг</label>
                                        <NumberInput
                                            value={step}
                                            onChange={setStep}
                                            placeholder="Введите шаг"
                                            min="0.0001"
                                            step="0.0001"
                                        />
                                    </div>
                                )}
                                {method.endpoint !== 'task1' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Точность</label>
                                        <NumberInput
                                            value={tolerance}
                                            onChange={setTolerance}
                                            placeholder="Введите точность"
                                            min="0.0000001"
                                            step="0.0000001"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-6">
                        <button
                            onClick={handleSolve}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Решение...' : 'Решить уравнение'}
                        </button>

                        <button
                            onClick={handleGenerateApi}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            <Link className="w-4 h-4"/>
                            Сформировать API запрос
                        </button>
                    </div>

                    {apiUrl && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h3 className="font-medium mb-2">API запрос:</h3>
                                    <div className="break-all font-mono text-sm">
                                        {apiUrl}
                                    </div>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(apiUrl)}
                                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
                                    title="Копировать в буфер обмена"
                                >
                                    <Copy className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <div className="flex">
                            <div className="flex-1">
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {results && (
                    <div className="space-y-6">
                        {METHOD_RESPONSE_TYPES[method.endpoint] === API_TYPES.SEPARATION && renderSeparationResults(results)}
                        {METHOD_RESPONSE_TYPES[method.endpoint] === API_TYPES.SOLUTION && renderSolutionResult(results)}
                        {METHOD_RESPONSE_TYPES[method.endpoint] === API_TYPES.COMPARISON && renderComparisonResults(results)}
                    </div>
                )}
            </div>
            );
            }