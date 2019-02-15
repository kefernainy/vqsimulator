//todo:
// ?? visual representation of the segments with colors representing saturation
// make CO and ventilation limited



//universal variables
var FiO2 = 0.2;
var Hb = 13; //grams of Hb in blood
var SatPulmArtery = 70; //saturation of mixed venous blood
var Patm = 713; //atmospheric pressure 
var SatPulmVein = SatPulmArtery;
var debug;
var hypoxicVasoconstriction = false;

var PCO2BloodInitial = 40;
var PCO2Blood;

var segmentsAvailable = 500;

var findEquilibriumPaO2SmallSegment = function(vt, co) {
	/*
    finds the gas equilibrium of O2 and CO2 for the segment
    vt and co are for the segment
    it returns an object carrying the segment's characteristics
    */
	var mySatPulmVein = SatPulmVein;
	var PAO2_Initial = FiO2 * Patm;
	var PAO2 = PAO2_Initial;
	var O2ContentSegment_Initial = FiO2 * vt;
	var O2ContentAirSegment = O2ContentSegment_Initial;
	while ((PO2fromSat(mySatPulmVein) < PAO2) && (mySatPulmVein < 100)) {

		/*
        decrease Content of Oxygen in segment by slowly adding Saturation to blood 
    until pressure in blood and segment the same
        
        1. Add 1% saturation to Pulm Vein
        2. Calculate how much O2 has been removed from the Air in the segment from adding 1% worth of oxygen
        3. Calculate how much the PAO2 becomes
        4. If the PaO2 and PAO2 are the same or Pa makes sat 100%: then stop
        */ 
		mySatPulmVein = mySatPulmVein + 1;

		O2ContentAirSegment = O2ContentAirSegment - ((co / 100) * Hb * 1.34 * 0.01);

		if (O2ContentAirSegment <= 0) {
			PAO2 = PO2fromSat(mySatPulmVein);
			O2ContentAirSegment = 0;
			break;
		}

		PAO2 = PAO2_Initial * O2ContentAirSegment / O2ContentSegment_Initial;
	}


	/*
    CO2 Section:
   Blood enters segment carrying a particular amount of CO2 content.
   that Content is decreased based on the ventilation of the segment
    - poorer ventilation will decrease the amount of CO2 extracted
    - higher CO2 content will increase the amount of CO2 extracted (higher gradient)
   
   The rate of CO2 removal depends on these 2 factors - the amount of CO2 removed per cc of minute ventilation in relation to the CO2 level is derived from the graph VentilationVsCO2.png which shows the average CO2 level required to reach equilibrium and remove 250cc of CO2.
    */

	PCO2Blood = PCO2BloodInitial;
	var CO2Removed = vt * VentilationFromCO2(PCO2Blood); //amount of CO2 content removed at that CO2 level (varies - will increase as CO2 levels rise)
	var CO2ContentBloodInitial = CO2ContentFromP(PCO2Blood) * co / 100;
	var CO2ContentBloodFinal = CO2ContentBloodInitial - CO2Removed;

	return {
		"venousSaturation": mySatPulmVein,
		"PAO2": PAO2,
		"CO2ContentBlood": CO2ContentBloodFinal,
		"CO2Removed": CO2Removed,
		"O2ContentSegment": ((co / 100) * Hb * 1.34 * (mySatPulmVein / 100)) //blood O2 content
	};
};


function rnd6() {
	return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) / 3;
}

var lungSegmentArray = [];

var totalCO = 0;
var totalVT = 0;

//shared variables

var CODistribution = [];
var VTDistribution = [];
var VQDistribution = [];
var COArray = [];
var VTArray = [];
var randomCO, randomVT;

for (var i = 0; i < 40; i++) CODistribution[i] = 0;
for (var i = 0; i < 40; i++) VTDistribution[i] = 0;
for (var i = 0; i < 40; i++) VQDistribution[i] = 0;

function distribute(f, segments, COMean, VTMean) {
	//CO and VT are averages that are specific to these segments
	//can make more segments with different CO and VT distributions (less or more)
	//COMean per segment * number of segments is the average cardiac output that's going to these segments
	//VTMean per segment * number of segments is the average VT going to these segments



	/*to increase average cardiac output you need to increase the mean (here 10) to 20. 
   The distribution would be twice mean -  40 then
     */

	for (var i = 0; i < segments; i++) {
		randomCO = COMean + Math.round(5 * f());
		randomVT = VTMean + Math.round(5 * f());

		COArray.push(randomCO);
		VTArray.push(randomVT);

		CODistribution[randomCO]++;
		VTDistribution[randomVT]++;
		VQDistribution[(randomVT * 10 / randomCO).toFixed(0)]++;

	}

	if (hypoxicVasoconstriction) {
		/*
    VQ matching algorithm:
    sort CO array from largest to smallest
    sort VT array from largest to smallest
    combine them into lungSegmentArray
    calculate the VQ for each one
*/
		COArray.sort(function(a, b) {
			return a - b;
		});
		VTArray.sort(function(a, b) {
			return a - b;
		});
	}

	for (var i = 0; i < segments; i++) {
		lungSegmentArray.push({
			"CO": COArray[i],
			"VT": VTArray[i],
			"VQ": VTArray[i] / COArray[i]
		});
	}

}

var drawGraphics = function() {
	var $container = $('#container');

	$container.empty();
	for (var i = 0; i < 40; i++) {
		$container.append($('<div>').css({
			left: 10 * i + 'px',
			"min-width": '10px',
			"opacity": 0.3,
			height: CODistribution[i] * 500 / segmentsAvailable + 'px',
			background: "Red"
		}));
	}

	for (var i = 0; i < 40; i++) {
		$container.append($('<div>').css({
			left: 10 * i + 'px',
			"min-width": "10px",
			"opacity": 0.3,
			height: VTDistribution[i] * 500 / segmentsAvailable + 'px',
			background: "Blue"
		}));
	}

	for (var i = 0; i < 40; i++) {
		$container.append($('<div>').css({
			left: 10 * i + 'px',
			"min-width": "10px",
			"opacity": 0.9,
			height: VQDistribution[i] * 300 / segmentsAvailable + 'px',
			background: "Black",
			"box-shadow": "1px 1px 3px Black"
		}));
	}

	for (var i = 0; i < 40; i++) {
		$container.append($('<div>').css({
			top: "0px",
			left: 10 * i + 'px',
			"min-width": "10px",
			"font-size": "7px",
			"opacity": 0.9
		}).html((i / 10).toFixed(1)));
	}

};

var getEquilibrium = function() {
	$.each(lungSegmentArray, function(i, o) {
		var thisSegmentEquil = findEquilibriumPaO2SmallSegment(o.VT, o.CO);
		o.venousSaturation = thisSegmentEquil.venousSaturation;
		o.PAO2 = thisSegmentEquil.PAO2;
		o.O2ContentSegment = thisSegmentEquil.O2ContentSegment;
		o.CO2Removed = thisSegmentEquil.CO2Removed;
	});
};

var calculateTotalSat = function() {
	var oxygenContentTotal = 0;
	$.each(lungSegmentArray, function(i, o) {
		oxygenContentTotal += Number(o.O2ContentSegment);
		totalCO += Number(o.CO);
		totalVT += Number(o.VT);
	});

	var saturationOfArterialBlood = oxygenContentTotal / ((totalCO * Hb * 1.34) / 100);
	var CO2ContentRemoved = 0;
	$.each(lungSegmentArray, function(i, o) {
		CO2ContentRemoved += Number(o.CO2Removed);
	});

	debug = ("Saturation: " + (saturationOfArterialBlood * 100).toFixed(0) + "% <br/>CO2 Removed: " + CO2ContentRemoved.toFixed(0) + "mL");
	$("#debug").html(debug);
};

function reset() {
	//resets values between runs
	totalCO = 0;
	totalVT = 0;
	lungSegmentArray = [];

	lungSegmentArray = [];


	//shared variables

	CODistribution = [];
	VTDistribution = [];
	VQDistribution = [];
	COArray = [];
	VTArray = [];

	for (var i = 0; i < 40; i++) CODistribution[i] = 0;
	for (var i = 0; i < 40; i++) VTDistribution[i] = 0;
	for (var i = 0; i < 40; i++) VQDistribution[i] = 0;
}

$(document).ready(function() {
	var $coRangeMain = $('#coRangeMain');
	var $vtRangeMain = $('#vtRangeMain');
	var $coRangeExtra = $('#coRangeExtra');
	var $vtRangeExtra = $('#vtRangeExtra');
	var $segmentsExtra = $('#segmentsExtra')

	var segmentsMain = segmentsAvailable - $segmentsExtra.val(); //how many segments available for main segments

	$coRangeMain.change(function() {
		reset();
		segmentsMain = segmentsAvailable - $segmentsExtra.val();
		distribute(rnd6, segmentsMain, Number($coRangeMain.val()), Number($vtRangeMain.val()));
		distribute(rnd6, $segmentsExtra.val(), Number($coRangeExtra.val()), Number($vtRangeExtra.val()));
		drawGraphics();
		getEquilibrium();
		calculateTotalSat();
		updateOutputs();
	});
	$vtRangeMain.change(function() {
		$('#coRangeMain').trigger("change");

	});

	$coRangeExtra.change(function() {
		$('#coRangeMain').trigger("change");

	});
	$vtRangeExtra.change(function() {
		$('#coRangeMain').trigger("change");

	});
	$segmentsExtra.change(function() {
		$('#coRangeMain').trigger("change");

	});

	$('#coRangeMain').trigger("change");

	function updateOutputs() {
		$("#coRangeOutput").val($coRangeMain.val());
		$("#vtRangeOutput").val($vtRangeMain.val());
		$("#vtRangeExtraOutput").val($vtRangeExtra.val());
		$("#coRangeExtraOutput").val($coRangeExtra.val());
		$("#segmentsExtraOutput").val($segmentsExtra.val());
		($("#segmentsMainOutput").val(segmentsMain));
	}


});